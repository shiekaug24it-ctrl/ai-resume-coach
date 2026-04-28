import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import type { Resume, Suggestion } from "@/types/api";

export const Route = createFileRoute("/resume/$id")({
  component: ResumeDetail,
});

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
      try {
        const { data } = await api.get(`/api/resumes/${id}`);
        setResume(data);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Resume not found");
      } finally {
        setFetching(false);
      }
    })();
  }, [user, id]);

  const handleDownload = () => {
    if (!resume) return;
    const baseUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
    const url = `${baseUrl}/api/resumes/${resume.id}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", resume.fileName);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error("Download failed"));
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm(`Delete "${resume.fileName}"?`)) return;
    try {
      await api.delete(`/api/resumes/${resume.id}`);
      toast.success("Deleted");
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
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

  const suggestions = resume.aiSuggestions ?? [];
  const keywords = resume.aiKeywords ?? [];
  const score = resume.aiScore;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-6 py-12">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{resume.fileName}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Uploaded {new Date(resume.createdAt).toLocaleString()} · {(resume.fileSize / 1024).toFixed(1)} KB
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

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="surface-glass rounded-2xl p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">AI Score</p>
            {score != null ? (
              <>
                <p className="mt-2 font-display text-7xl font-bold text-gradient-accent">{score}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Good - room to grow" : "Needs improvement"}
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
            {resume.aiSummary ? (
              <p className="mt-3 text-muted-foreground">{resume.aiSummary}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Waiting for AI analysis to complete...</p>
            )}
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="mt-6 surface-glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Detected keywords</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span key={kw} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-6 surface-glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">AI Suggestions</h3>
            <div className="mt-4 space-y-3">
              {suggestions.map((s: Suggestion, i: number) => (
                <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface-3 p-4">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    s.priority === "high" ? "bg-destructive" : s.priority === "medium" ? "bg-accent" : "bg-muted-foreground"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.category}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-accent">{s.priority}</span>
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

