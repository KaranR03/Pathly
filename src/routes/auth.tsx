import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/pathly/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Pathly — AI job discovery across Australia" },
      {
        name: "description",
        content:
          "Sign in to Pathly with email or Google to save jobs, track applications and close your skill gaps — or explore as a guest.",
      },
      { property: "og:title", content: "Sign in to Pathly" },
      {
        property: "og:description",
        content:
          "Save jobs, track applications and close skill gaps on Australia's job map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, signIn, signUp, signInWithGoogle, continueAsGuest } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "guest">(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy("email");
    if (mode === "signin") {
      const { error } = await signIn(email.trim(), password);
      setBusy(null);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Welcome back");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    const { error, needsConfirmation } = await signUp(
      name.trim() || "New member",
      email.trim(),
      password,
    );
    setBusy(null);
    if (error) {
      toast.error(error);
      return;
    }
    if (needsConfirmation) {
      toast.success("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center">
            <Wordmark />
          </div>
          <h1 className="mt-6 text-center text-[26px] font-semibold tracking-tight">
            {mode === "signin"
              ? "Sign in to Pathly"
              : "Create your Pathly account"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Keep your profile, saved jobs and applications in one place.
          </p>

          <div className="mt-7 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <button
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                setBusy("google");
                const { error } = await signInWithGoogle();
                if (error) {
                  setBusy(null);
                  toast.error(error);
                }
              }}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-background px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              {busy === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.24 1.4-1.72 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8c1.6 0 3 .6 4 1.6l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.9H12z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] tracking-wide text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "signup" && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none focus:border-foreground/30"
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email address"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none focus:border-foreground/30"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                placeholder="Password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none focus:border-foreground/30"
              />
              <button
                type="submit"
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy === "email" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signin"
                ? "New to Pathly? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setBusy("guest");
              continueAsGuest();
              navigate({ to: "/dashboard", replace: true });
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserRound className="size-4" />
            Continue as guest
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Guest mode explores the full demo with the Alex Morgan profile.
            Nothing is saved to an account.
          </p>
        </div>
      </main>
    </div>
  );
}
