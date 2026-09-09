/**
 * Login route — /login
 *
 * Renders the sign-in UI when auth is enabled.
 * Redirects to "/" if already signed in or if auth is disabled.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoopMark } from "@/components/gauntlet/loop-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authEnabled) {
      void navigate({ to: "/" });
      return;
    }
    if (session?.user) {
      void navigate({ to: "/" });
    }
  }, [session, navigate]);

  if (isPending || !authEnabled) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? "User",
        });
        if (res.error) {
          setError(res.error.message ?? "Sign up failed.");
        }
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message ?? "Sign in failed.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <LoopMark className="size-10 text-accent" />
          <h1 className="font-display text-2xl tracking-tight text-fg">
            Sign in to Gauntlet
          </h1>
          <p className="text-center text-sm text-muted">
            Your neural memory assistant
          </p>
        </div>

        {/* OAuth Providers */}
        {GROK_PROVIDERS.length > 0 && (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="secondary"
                className="w-full justify-center gap-2"
                onClick={() => void signIn(p.providerId)}
              >
                Sign in with {p.label}
              </Button>
            ))}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg px-2 text-muted">or</span>
              </div>
            </div>
          </div>
        )}

        {/* Email/Password */}
        <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-fail">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="w-full text-center text-sm text-muted hover:text-fg"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
