import React, { useState } from "react";
import { LogIn, LogOut, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, logOut } from "@/lib/firebase";
import { useAuthUser } from "@/lib/auth/use-firebase-auth";
import { UnauthorizedDomainModal } from "./unauthorized-domain-modal";
import { toast } from "sonner";

export function FirebaseAuthButton() {
  const { user, loading, isGuest, setGuestMode, clearGuestMode } = useAuthUser();
  const [domainModalOpen, setDomainModalOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      const u = await signInWithGoogle();
      clearGuestMode();
      toast.success("Signed in with Google", {
        description: `Welcome, ${u.displayName || u.email}! Your missions and memories are now synced with Cloud Firestore.`,
      });
    } catch (err: unknown) {
      console.error("Firebase Sign-in error:", err);
      const code = (err as { code?: string })?.code || "";
      const msg = err instanceof Error ? err.message : String(err);

      if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
        setDomainModalOpen(true);
        toast.error("Firebase Domain Authorization Required", {
          description: "This domain must be added to Firebase Authorized Domains.",
        });
      } else if (code === "auth/popup-closed-by-user") {
        toast.info("Google Sign-In popup was closed.");
      } else if (code === "auth/popup-blocked") {
        toast.error("Sign-in popup blocked by browser", {
          description: "Please allow popups for this site to sign in with Google.",
        });
      } else {
        toast.error("Google Sign-In failed", {
          description: msg,
        });
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (isGuest) {
        clearGuestMode();
      } else {
        await logOut();
      }
      toast.info("Signed out", {
        description: "Local mission data is preserved safely in your browser.",
      });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Sign-out error");
    }
  };

  const handleContinueGuest = () => {
    setGuestMode(true);
    setDomainModalOpen(false);
    toast.success("Guest Mode Active", {
      description: "You can create and run autonomous agent missions in local browser storage.",
    });
  };

  return (
    <>
      {domainModalOpen && (
        <UnauthorizedDomainModal
          onClose={() => setDomainModalOpen(false)}
          onContinueGuest={handleContinueGuest}
        />
      )}

      {loading ? (
        <div className="flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-surface-2/60 px-2.5 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-accent animate-ping" />
          <span className="font-mono text-[11px]">Connecting...</span>
        </div>
      ) : !user && !isGuest ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSignIn}
          className="h-8 gap-1.5 rounded-lg border-border/70 bg-surface-2/60 hover:bg-surface-2 px-2.5 text-xs font-medium text-fg/90 transition-colors"
        >
          <LogIn className="size-3.5 text-muted" />
          <span>Sign In</span>
        </Button>
      ) : isGuest ? (
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-surface-2/60 px-2 text-xs transition-colors hover:border-border">
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <UserCheck className="size-3" />
            </div>
            <span className="font-medium text-fg/90 text-xs">Guest</span>
            <span className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted">
              Local
            </span>
          </div>

          <div className="ml-1 flex items-center gap-0.5 border-l border-border/60 pl-1">
            <button
              type="button"
              onClick={handleSignIn}
              title="Connect Google Cloud Sync"
              className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <LogIn className="size-3" />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              title="Reset Guest Session"
              className="flex size-6 items-center justify-center rounded text-muted hover:text-fg hover:bg-surface-3 transition-colors"
            >
              <LogOut className="size-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex h-8 items-center gap-2 rounded-lg border border-border/70 bg-surface-2/60 pl-1.5 pr-2 text-xs transition-colors hover:border-border hover:bg-surface-2/80">
          <div className="relative flex items-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="size-5 rounded-full object-cover ring-1 ring-border/80"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-5 items-center justify-center rounded-full bg-accent/20 font-mono text-[10px] font-semibold text-accent">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 ring-2 ring-surface-2"
              title="Cloud Firestore Active"
            />
          </div>

          <span className="max-w-[96px] truncate font-medium text-fg/90 text-xs">
            {user.displayName?.split(" ")[0] || user.email?.split("@")[0]}
          </span>

          <span className="hidden xl:inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
            <Sparkles className="size-2" />
            Sync
          </span>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="ml-0.5 flex size-5 items-center justify-center rounded text-muted hover:text-fg hover:bg-surface-3 transition-colors"
          >
            <LogOut className="size-3" />
          </button>
        </div>
      )}
    </>
  );
}
