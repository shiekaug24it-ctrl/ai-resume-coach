import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/resume/$id")({
  component: ResumeDetail,
});

type Resume = Tables<"resumes">;
type Suggestion = { category: string; tip: string; priority: "high" | "medium" | "low" };

function ResumeDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) toast.error(error.message);
      else setResume(data);
      setFetching(false);
    })();
  }, [user, id]);

  const handleDownload = async () => {
    if (!resume) return;
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.file_path, 60);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm(`Delete "${resume.file_name}"?`)) return;
    await supabase.storage.from("resumes").remove([resume.file_path]);
    await supabase.from("resumes").delete().eq("id", resume.id);
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Resume not found.</p>
          <Button className="mt-4" asChild variant="outlineGlow">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const suggestions = (resume.ai_suggestions as Suggestion[] | null) ?? [];
  const keywords = (resume.ai_keywords as string[] | null) ?? [];
  const score = resume.ai_score;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-6 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{resume.file_name}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Uploaded {new Date(resume.created_at).toLocaleString()} ·{" "}
              {(resume.file_size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outlineGlow" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Score + summary */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="surface-glass rounded-2xl p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              AI Score
            </p>
            {score != null ? (
              <>
                <p className="mt-2 font-display text-7xl font-bold text-gradient-accent">{score}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {score >= 85
                    ? "Excellent"
                    : score >= 70
                      ? "Strong"
                      : score >= 55
                        ? "Good — room to grow"
                        : "Needs improvement"}
                </p>
              </>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <p className="text-sm">Analyzing...</p>
              </div>
            )}
          </div>

          <div className="surface-glass rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-display text-lg font-semibold">
              <Sparkles className="mr-2 inline h-4 w-4 text-accent" /> Summary
            </h3>
            {resume.ai_summary ? (
              <p className="mt-3 text-muted-foreground">{resume.ai_summary}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Waiting for AI analysis to complete...
              </p>
            )}
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="mt-6 surface-glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Detected keywords</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-6 surface-glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">AI Suggestions</h3>
            <div className="mt-4 space-y-3">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-surface-3 p-4"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      s.priority === "high"
                        ? "bg-destructive"
                        : s.priority === "medium"
                          ? "bg-accent"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.category}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                        {s.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{s.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
