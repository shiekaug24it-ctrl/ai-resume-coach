import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, Trash2, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { extractResumeText } from "@/lib/extractText";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

type Resume = Tables<"resumes">;

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const loadResumes = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setResumes(data ?? []);
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (user) loadResumes();
  }, [user, loadResumes]);

  const validateFile = (file: File): string | null => {
    const lower = file.name.toLowerCase();
    const okExt = ALLOWED_EXT.some((e) => lower.endsWith(e));
    const okType = ALLOWED.includes(file.type);
    if (!okExt && !okType) return "Only PDF, DOC, or DOCX files are allowed.";
    if (file.size > MAX_SIZE)
      return `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max 5 MB.`;
    if (file.size === 0) return "File appears to be empty.";
    return null;
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // Extract text
      let extracted = "";
      try {
        extracted = await extractResumeText(file);
      } catch (e) {
        console.warn("text extraction failed", e);
      }

      // Insert row
      const { data: row, error: insErr } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          extracted_text: extracted || null,
          status: extracted ? "analyzing" : "uploaded",
        })
        .select()
        .single();
      if (insErr) throw insErr;

      toast.success("Uploaded — running AI analysis...");
      await loadResumes();

      // Kick off AI analysis if we have text
      if (extracted && row) {
        analyzeResume(row.id, extracted, file.name);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async (resumeId: string, text: string, fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeText: text, fileName },
      });
      if (error) {
        if (error.message?.includes("429"))
          toast.error("Rate limit reached. Try again in a moment.");
        else if (error.message?.includes("402"))
          toast.error("AI credits exhausted. Add funds to keep analyzing.");
        else toast.error(error.message);
        return;
      }
      const analysis = data?.analysis;
      if (!analysis) {
        toast.error("Analysis returned no data");
        return;
      }
      await supabase
        .from("resumes")
        .update({
          ai_score: analysis.score,
          ai_summary: analysis.summary,
          ai_suggestions: analysis.suggestions,
          ai_keywords: analysis.keywords,
          status: "analyzed",
        })
        .eq("id", resumeId);
      toast.success("Analysis complete!");
      loadResumes();
    } catch (e) {
      console.error(e);
      toast.error("Analysis failed");
    }
  };

  const handleDelete = async (resume: Resume) => {
    if (!confirm(`Delete "${resume.file_name}"?`)) return;
    await supabase.storage.from("resumes").remove([resume.file_path]);
    const { error } = await supabase.from("resumes").delete().eq("id", resume.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      loadResumes();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Dashboard</p>
            <h1 className="mt-1 text-4xl font-bold">Your resumes</h1>
            <p className="mt-2 text-muted-foreground">Upload, analyze, and manage your resumes.</p>
          </div>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative mb-12 rounded-2xl border-2 border-dashed p-12 text-center transition ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-accent/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </div>
          <h3 className="font-display text-lg font-semibold">
            {uploading ? "Uploading & analyzing..." : "Drop your resume here"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, DOC, or DOCX · Max 5 MB
          </p>
          <Button
            variant="hero"
            className="mt-6"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose file
          </Button>
        </div>

        {/* List */}
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold">Saved resumes</h2>

          {fetching ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              No resumes yet. Upload one to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resumes.map((r) => (
                <ResumeCard key={r.id} resume={r} onDelete={() => handleDelete(r)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResumeCard({ resume, onDelete }: { resume: Resume; onDelete: () => void }) {
  const score = resume.ai_score;
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{resume.file_name}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {(resume.file_size / 1024).toFixed(1)} KB ·{" "}
              {new Date(resume.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground transition hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-3 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            AI Score
          </p>
          {score != null ? (
            <p className="mt-1 font-display text-3xl font-bold text-gradient-accent">{score}</p>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
            </p>
          )}
        </div>
        <Button variant="outlineGlow" size="sm" asChild>
          <Link to="/resume/$id" params={{ id: resume.id }}>
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {resume.ai_summary && (
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
          {resume.ai_summary}
        </p>
      )}
    </div>
  );
}
