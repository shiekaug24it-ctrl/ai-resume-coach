import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, Trash2, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { extractResumeText } from "@/lib/extractText";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import type { Resume } from "@/types/api";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

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
    setFetching(true);
    try {
      const { data } = await api.get("/api/resumes");
      setResumes(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to load resumes");
    } finally {
      setFetching(false);
    }
  }, []);

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
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      let extracted = "";
      try {
        extracted = await extractResumeText(file);
      } catch (e) {
        console.warn("text extraction failed", e);
      }

      const formData = new FormData();
      formData.append("file", file);
      if (extracted) {
        formData.append("extractedText", extracted);
      }

      const { data } = await api.post("/api/resumes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data.status === "analyzing" ? "Uploaded - running AI analysis..." : "Uploaded!");
      await loadResumes();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await api.delete(`/api/resumes/${id}`);
      toast.success("Deleted");
      loadResumes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Delete failed");
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

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative mb-12 rounded-2xl border-2 border-dashed p-12 text-center transition ${
            dragOver ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/50"
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
          <p className="mt-1 text-sm text-muted-foreground">PDF, DOC, or DOCX · Max 5 MB</p>
          <Button variant="hero" className="mt-6" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Choose file
          </Button>
        </div>

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
                <ResumeCard key={r.id} resume={r} onDelete={() => handleDelete(r.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResumeCard({ resume, onDelete }: { resume: Resume; onDelete: () => void }) {
  const score = resume.aiScore;
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{resume.fileName}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {(resume.fileSize / 1024).toFixed(1)} KB · {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button onClick={onDelete} className="text-muted-foreground transition hover:text-destructive" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-3 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">AI Score</p>
          {score != null ? (
            <p className="mt-1 font-display text-3xl font-bold text-gradient-accent">{score}</p>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
            </p>
          )}
        </div>
        <Button variant="outlineGlow" size="sm" asChild>
          <Link to="/resume/$id" params={{ id: String(resume.id) }}>
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {resume.aiSummary && (
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
          {resume.aiSummary}
        </p>
      )}
    </div>
  );
}

