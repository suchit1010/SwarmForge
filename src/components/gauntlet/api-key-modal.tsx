import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Layers,
  LoaderCircle,
  Play,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGauntlet } from "@/lib/gauntlet/store";
import {
  checkServerKeyStatusServerFn,
  verifyApiKeyDiagnosticsServerFn,
} from "@/lib/gauntlet/verify-key";
import type { ApiKeyDiagnostics } from "@/lib/gauntlet/gemini-client";

type Props = {
  onClose: () => void;
  requiredForLaunch?: boolean;
};

export function ApiKeyModal({ onClose, requiredForLaunch }: Props) {
  const currentKey = useGauntlet((s) => s.apiKey);
  const setApiKey = useGauntlet((s) => s.setApiKey);
  const [value, setValue] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ApiKeyDiagnostics | null>(null);
  const [serverStatus, setServerStatus] = useState<{
    hasServerKey: boolean;
    prefix?: string;
    model: string;
  } | null>(null);

  // Check server environment key status on mount
  useEffect(() => {
    let mounted = true;
    checkServerKeyStatusServerFn()
      .then((status) => {
        if (mounted) setServerStatus(status);
      })
      .catch(() => {
        // pass
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmed = value.trim();
  const isKnownAiStudio = trimmed.startsWith("AIzaSy") || trimmed.startsWith("AQ.");
  const isKeyEmpty = !trimmed && !serverStatus?.hasServerKey;

  const handleTestKey = async () => {
    if (!trimmed && !serverStatus?.hasServerKey) {
      toast.error("Please enter a Gemini API key first.");
      return;
    }

    setTesting(true);
    setDiagnostics(null);
    try {
      const res = await verifyApiKeyDiagnosticsServerFn({
        data: { apiKey: trimmed || undefined },
      });
      setDiagnostics(res);
      if (res.ok) {
        toast.success(
          `All Parameter Tests Passed! (${res.latencyMs}ms · ${res.model || "Gemini Flash"})`,
        );
      } else {
        toast.error(res.error || "Key parameter validation failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification request failed";
      setDiagnostics({
        ok: false,
        formatValid: false,
        jsonSchemaPassed: false,
        multiAgentReady: false,
        tests: [
          {
            id: "network_err",
            name: "Connection Probe",
            category: "latency",
            status: "failed",
            detail: msg,
          },
        ],
        error: msg,
      });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed && !serverStatus?.hasServerKey) {
      toast.error("Please provide a valid Gemini API key to run missions.");
      return;
    }

    setApiKey(trimmed);
    toast.success(
      trimmed
        ? "Gemini API key saved & persisted in local storage!"
        : "Using server-configured environment key.",
    );
    onClose();
  };

  const handleClear = () => {
    setValue("");
    setApiKey("");
    setDiagnostics(null);
    toast.info("Stored API key cleared from browser.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-bg/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="api-key-title"
        className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-2xl transition-all overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/80 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-gemini-blue/40 bg-gemini-blue/10 text-gemini-blue">
              <Key className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="api-key-title" className="font-display text-lg tracking-tight font-medium text-fg">
                  Google Gemini API Key
                </h2>
                {requiredForLaunch && (
                  <span className="rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-mono text-accent">
                    Required to Launch
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted">
                Direct Gemini 3.5 & 2.0 Flash access for autonomous 6-agent execution
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSave} className="mt-4 flex flex-col min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Notice if required for launch */}
          {requiredForLaunch && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-fg flex items-start gap-2.5">
              <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-accent">API Key Required to Run Missions:</strong>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  The Gauntlet multi-agent pipeline requires a Google Gemini API key to run Lead decomposition, Builder generation, Critic evaluations, and Action Safety Gates.
                </p>
              </div>
            </div>
          )}

          {/* Server Key Banner if detected */}
          {serverStatus?.hasServerKey && (
            <div className="rounded-xl border border-pass/30 bg-pass/5 p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-pass" />
                <div>
                  <span className="font-medium text-pass">Server Environment Key Active</span>
                  <p className="text-[11px] text-muted font-mono">{serverStatus.prefix} ({serverStatus.model})</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded border border-border">
                Optional Override Below
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Gemini API Key
              </label>
              {currentKey && (
                <span className="font-mono text-[11px] text-pass flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Active in Browser Store
                </span>
              )}
            </div>

            <div className="relative mt-1.5 flex items-center">
              <Input
                type={showKey ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setDiagnostics(null);
                }}
                placeholder={serverStatus?.hasServerKey ? "Using server key, or paste AIzaSy... / AQ... here" : "AIzaSy... or AQ..."}
                className="pr-20 font-mono text-sm bg-surface-2 border-border/80 focus:border-gemini-blue/60"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 rounded p-1 text-muted hover:text-fg"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Real-time Syntax Helper */}
            {trimmed && isKnownAiStudio && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-pass font-mono">
                <CheckCircle2 className="size-3 shrink-0" />
                Valid Google AI Studio key syntax detected ({trimmed.startsWith("AQ.") ? "AI Studio project key 'AQ.'" : "Standard key 'AIzaSy...'"})
              </p>
            )}

            {trimmed && !isKnownAiStudio && trimmed.length >= 20 && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted font-mono">
                <CheckCircle2 className="size-3 text-pass shrink-0" />
                Custom API key syntax detected ({trimmed.length} characters)
              </p>
            )}

            {!trimmed && (
              <p className="mt-1.5 text-[11px] text-muted">
                Supports Google AI Studio keys starting with{" "}
                <code className="text-accent font-mono">AIzaSy...</code> or{" "}
                <code className="text-accent font-mono">AQ...</code>
              </p>
            )}
          </div>

          {/* Live Parameter Diagnostic Test Results */}
          {diagnostics && (
            <div
              className={`rounded-xl border p-4 text-xs space-y-3 ${
                diagnostics.ok
                  ? "border-pass/40 bg-pass/5 text-fg"
                  : "border-fail/40 bg-fail/5 text-fg"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  {diagnostics.ok ? (
                    <CheckCircle2 className="size-4 text-pass" />
                  ) : (
                    <X className="size-4 text-fail" />
                  )}
                  <span className="font-medium font-mono text-sm">
                    {diagnostics.ok ? "Full Parameter Verification Passed" : "Parameter Verification Failed"}
                  </span>
                </div>
                {diagnostics.latencyMs !== undefined && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted">
                    {diagnostics.latencyMs}ms total probe
                  </span>
                )}
              </div>

              {diagnostics.error && (
                <p className="text-[11px] text-fail bg-fail/10 p-2 rounded-lg border border-fail/30 leading-relaxed font-mono">
                  {diagnostics.error}
                </p>
              )}

              {/* Parameter checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Parameter & Capabilities Diagnostics:
                </span>
                <div className="grid gap-1.5">
                  {diagnostics.tests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start justify-between gap-2 rounded-lg bg-surface-2/60 border border-border/50 px-2.5 py-1.5 text-[11px]"
                    >
                      <div className="flex items-start gap-2">
                        {test.status === "passed" && (
                          <CheckCircle2 className="size-3.5 text-pass shrink-0 mt-0.5" />
                        )}
                        {test.status === "failed" && (
                          <X className="size-3.5 text-fail shrink-0 mt-0.5" />
                        )}
                        {test.status === "skipped" && (
                          <div className="size-3.5 rounded-full border border-muted/50 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium text-fg">{test.name}</span>
                          <p className="text-[10px] text-muted">{test.detail}</p>
                        </div>
                      </div>
                      {test.durationMs !== undefined && (
                        <span className="font-mono text-[10px] text-muted shrink-0">
                          {test.durationMs}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parameter Suite Information Callout */}
          <div className="rounded-xl border border-border/80 bg-surface-2 p-3 text-xs text-muted space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-fg">
              <Zap className="size-3.5 text-accent" />
              <span>Full Production Parameter Coverage</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-muted">
                <Cpu className="size-3 text-gemini-blue" />
                <span>Gemini 3.5 & 2.5 Flash Fallback</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Layers className="size-3 text-gemini-blue" />
                <span>Structured JSON Schema Parsing</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Radio className="size-3 text-gemini-blue" />
                <span>Live Audio & Vision Streaming</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <ShieldCheck className="size-3 text-pass" />
                <span>Client-Side LocalStorage Encryption</span>
              </div>
            </div>
          </div>

          {/* Links & Test Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent underline hover:opacity-80 font-medium"
            >
              Get a free API key at Google AI Studio
              <ExternalLink className="size-3" />
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestKey}
              disabled={testing || (!trimmed && !serverStatus?.hasServerKey)}
              className="text-xs border-gemini-blue/40 text-fg hover:bg-gemini-blue/10 gap-1.5"
            >
              {testing ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin text-gemini-blue" />
                  Running Parameter Diagnostics…
                </>
              ) : (
                <>
                  <Play className="size-3 text-gemini-blue" />
                  Test Connection & Parameters
                </>
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4 shrink-0">
            {currentKey ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-fail hover:bg-fail/10 hover:text-fail"
              >
                <Trash2 className="size-3.5 mr-1" />
                Clear Stored Key
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isKeyEmpty}
                className="ai-studio-btn-glow bg-accent text-accent-fg hover:bg-accent/90"
              >
                Save & Apply Key
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

