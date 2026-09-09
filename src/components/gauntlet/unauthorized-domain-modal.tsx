import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import firebaseConfig from "@/../firebase-applet-config.json";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
  onContinueGuest: () => void;
};

export function UnauthorizedDomainModal({ onClose, onContinueGuest }: Props) {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "gauntletgemini.vercel.app";
  const projectId = firebaseConfig.projectId || "moonlit-watch-453506-f7";
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      toast.success("Domain copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy domain");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-bg/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="auth-domain-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h2 id="auth-domain-title" className="font-display text-base font-medium text-fg">
                Firebase Domain Authorization
              </h2>
              <p className="font-mono text-[11px] text-muted">
                OAuth domain whitelist setup for Google Sign-In
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="size-4.5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-fg">
                Current Domain is not whitelisted in Firebase:
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                Firebase Authentication restricts Google Sign-In popups to domains registered in your Firebase Console to prevent unauthorized OAuth redirects.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Current Domain to Authorize:
            </label>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs">
              <span className="text-accent font-semibold">{currentDomain}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-7 text-[11px] gap-1 border-border bg-surface hover:bg-surface-2"
              >
                {copied ? <Check className="size-3 text-pass" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy Domain"}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border/80 bg-surface-2/60 p-3.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-medium">
              Quick Setup Instructions (Takes 30 Seconds):
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-fg/90 pl-1 leading-relaxed">
              <li>
                Open the{" "}
                <a
                  href={consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline font-medium inline-flex items-center gap-0.5"
                >
                  Firebase Authentication Settings
                  <ExternalLink className="size-2.5 inline" />
                </a>
              </li>
              <li>
                Scroll down to the <strong>Authorized domains</strong> section.
              </li>
              <li>
                Click <strong>Add domain</strong>, paste <code className="font-mono bg-bg px-1 py-0.5 rounded text-accent">{currentDomain}</code>, and click <strong>Add</strong>.
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onContinueGuest}
              className="text-xs border-border gap-1.5 font-medium"
            >
              <UserCheck className="size-3.5 text-pass" />
              Continue as Guest (Local Mode)
            </Button>

            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                type="button"
                className="w-full sm:w-auto text-xs bg-accent text-accent-fg hover:bg-accent/90 gap-1.5"
              >
                Open Firebase Console
                <ExternalLink className="size-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
