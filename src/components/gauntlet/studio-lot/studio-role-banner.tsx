import { Clapperboard, Sliders, ShieldAlert, Sparkles, Film } from "lucide-react";
import { usePartnerEcosystem } from "@/lib/gauntlet/partner-ecosystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StudioRoleBannerProps {
  onOpenTrailerModal: () => void;
  onOpenDevpostModal: () => void;
}

export function StudioRoleBanner({
  onOpenTrailerModal,
  onOpenDevpostModal,
}: StudioRoleBannerProps) {
  const activeRole = usePartnerEcosystem((s) => s.activeStudioRole);
  const setActiveRole = usePartnerEcosystem((s) => s.setActiveStudioRole);

  const roles = [
    {
      id: "DIRECTOR" as const,
      label: "The Director",
      icon: Clapperboard,
      desc: "Gemini Multi-Agent Crew · Script-to-Dailies Breakdown",
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    },
    {
      id: "PRODUCER" as const,
      label: "Technical Producer",
      icon: Sliders,
      desc: "Managed MCP Pipelines · Grafana / ClickHouse / Replit",
      color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    },
    {
      id: "STUDIO_HEAD" as const,
      label: "Studio Head",
      icon: ShieldAlert,
      desc: "Cloud IAM Security · Budget Governance & Greenlight",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Hackathon Identifier */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Film className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight text-fg">
                  Summer Blockbuster Studio Lot
                </h2>
                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                  Google Cloud Agent Builder
                </Badge>
              </div>
              <p className="text-xs text-muted">
                Reverse-engineered for Media & Entertainment autonomous workflows. Direct your AI crew, execute MCP pipelines, and greenlight productions.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: 3-Minute Trailer & Devpost Package */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenTrailerModal}
            className="border-border text-xs gap-1.5 hover:bg-surface-2"
          >
            <Clapperboard className="size-3.5 text-accent" />
            <span>3-Min Trailer Rehearsal</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenDevpostModal}
            className="bg-accent text-accent-fg hover:bg-accent/90 text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="size-3.5" />
            <span>Devpost Package</span>
          </Button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/60">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = activeRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent shadow-sm"
                  : "border-border/60 bg-surface-2/40 hover:bg-surface-2 hover:border-border"
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${role.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-xs text-fg">
                    {role.label}
                  </span>
                  {isSelected && (
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted truncate">
                  {role.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
