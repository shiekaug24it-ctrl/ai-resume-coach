import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, Sparkles, Zap, Shield, BarChart3, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-6 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full surface-glass px-3 py-1 text-xs font-mono text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                AI-powered resume intelligence
              </div>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Decode your career potential with{" "}
                <span className="text-gradient-accent">SmartAI Resume</span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                Upload your resume, get an instant AI score, keyword analysis, and actionable suggestions tailored to land your next role.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to={user ? "/dashboard" : "/auth"}>
                    <Upload className="h-4 w-4" />
                    Upload your resume
                  </Link>
                </Button>
                <Button variant="outlineGlow" size="lg" asChild>
                  <a href="#features">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2 text-xs font-mono text-muted-foreground">
                <span>✓ PDF, DOC, DOCX</span>
                <span>✓ Max 5MB</span>
                <span>✓ Private & secure</span>
              </div>
            </div>

            {/* Mock analysis card */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 bg-gradient-brand opacity-20 blur-3xl" />
              <div className="surface-glass rounded-2xl p-6 shadow-card">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">resume-final.pdf</p>
                    <p className="font-display text-sm font-semibold">Analyzing...</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-accent/60 animate-pulse [animation-delay:120ms]" />
                    <div className="h-2 w-2 rounded-full bg-accent/30 animate-pulse [animation-delay:240ms]" />
                  </div>
                </div>

                <div className="mb-6 rounded-xl bg-surface-3 p-6 text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Overall Score</p>
                  <p className="mt-2 font-display text-6xl font-bold text-gradient-accent">87</p>
                  <p className="mt-1 text-xs text-muted-foreground">Strong candidate · Top 15%</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-surface-3 p-3">
                    <p className="font-mono text-[10px] text-muted-foreground">KEYWORDS</p>
                    <p className="mt-1 font-display text-lg font-semibold">24</p>
                  </div>
                  <div className="rounded-lg bg-surface-3 p-3">
                    <p className="font-mono text-[10px] text-muted-foreground">TIPS</p>
                    <p className="mt-1 font-display text-lg font-semibold">7</p>
                  </div>
                  <div className="rounded-lg bg-surface-3 p-3">
                    <p className="font-mono text-[10px] text-muted-foreground">MATCH</p>
                    <p className="mt-1 font-display text-lg font-semibold text-accent">+15%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Features</p>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Everything you need to stand out</h2>
            <p className="mt-4 text-muted-foreground">
              Built for job seekers who want data-backed feedback, not guesswork.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileSearch, title: "Smart Analysis", body: "Instant AI scoring with section-by-section breakdown of what works and what doesn't." },
              { icon: Sparkles, title: "Actionable Tips", body: "Get specific suggestions on wording, formatting, and skill gaps prioritized by impact." },
              { icon: BarChart3, title: "Keyword Match", body: "Discover the keywords recruiters and ATS systems are looking for in your industry." },
              { icon: Zap, title: "Lightning Fast", body: "Drop a PDF, get a full analysis in seconds — no more waiting on review services." },
              { icon: Shield, title: "Private & Secure", body: "Your resumes stay yours. Stored securely with row-level encryption." },
              { icon: Upload, title: "Easy Upload", body: "Drag-and-drop PDF, DOC, or DOCX up to 5MB. Manage all versions in one dashboard." },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:shadow-glow">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <div className="surface-glass relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center">
            <div className="absolute inset-0 -z-10 bg-gradient-hero" />
            <h2 className="text-4xl font-bold md:text-5xl">Ready to land the interview?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Upload your resume and get AI-powered feedback in under 30 seconds.
            </p>
            <div className="mt-8">
              <Button variant="hero" size="lg" asChild>
                <Link to={user ? "/dashboard" : "/auth"}>
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 SmartAI Resume</p>
          <p className="font-mono">Built with intelligence ✦</p>
        </div>
      </footer>
    </div>
  );
}
