import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Required").max(100);

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      toast.success("Account created!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent">
            <Sparkles className="h-4 w-4 text-accent-foreground" />
          </span>
          SmartAI Resume
        </Link>

        <div className="surface-glass rounded-2xl p-8 shadow-card">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input id="signup-name" name="name" type="text" autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" autoComplete="new-password" required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
