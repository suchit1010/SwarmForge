import { RefreshCw, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTelemetryService } from "@/services/telemetry-service";
import { useSpotlight } from "@/lib/use-spotlight";

export function MicroserviceMeshMonitor() {
  const telemetry = useTelemetryService((s) => s.telemetry);
  const refreshTelemetry = useTelemetryService((s) => s.refreshTelemetry);
  const tripCircuitBreaker = useTelemetryService((s) => s.tripCircuitBreaker);
  const resetCircuitBreaker = useTelemetryService((s) => s.resetCircuitBreaker);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spotlight = useSpotlight();

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshTelemetry();
    setTimeout(() => setIsRefreshing(false), 300);
    toast.success("Telemetry Synced", {
      description: "Polled 6 microservice health endpoints.",
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-5 text-accent" />
            <h3 className="font-display text-lg font-semibold tracking-tight text-fg">
              Cloud Microservices Mesh & Telemetry
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              6 Services Online
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Independent, horizontally scalable domain services ready for Cloud Run & Kubernetes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs font-mono">
            <span className="text-muted">Avg Latency:</span>
            <span className="font-semibold text-pass">{telemetry.avgLatencyMs}ms</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs border-border"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Poll Cluster</span>
          </Button>
        </div>
      </div>

      {/* Cluster Overview Metrics */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-surface-2/60 p-3">
          <span className="text-[10px] font-mono uppercase text-muted">Throughput</span>
          <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-fg">
            {telemetry.totalRequestsToday.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted">requests / 24h</span>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2/60 p-3">
          <span className="text-[10px] font-mono uppercase text-muted">P99 Latency</span>
          <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-pass">
            68ms
          </p>
          <span className="text-[10px] text-pass">optimal SLA</span>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2/60 p-3">
          <span className="text-[10px] font-mono uppercase text-muted">Active Agents</span>
          <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-accent">
            3 Gemini
          </p>
          <span className="text-[10px] text-accent">Lead · Builder · Critic</span>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2/60 p-3">
          <span className="text-[10px] font-mono uppercase text-muted">Circuit Breakers</span>
          <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-fg">
            {telemetry.circuitBreakersTripped === 0 ? "0 Tripped" : `${telemetry.circuitBreakersTripped} Active`}
          </p>
          <span className="text-[10px] text-muted">auto-failover ready</span>
        </div>
      </div>

      {/* Microservice Grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {telemetry.services.map((srv) => (
          <div
            key={srv.serviceId}
            className={`ai-studio-card rounded-xl border p-4 transition-all ${
              srv.circuitBreaker === "OPEN"
                ? "border-fail/50 bg-fail/5"
                : "border-border/70 bg-surface-2/40 hover:border-border"
            }`}
            {...spotlight}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-semibold text-fg truncate">
                    {srv.name}
                  </span>
                  <span className="font-mono text-[9px] text-muted rounded bg-surface-3 px-1 py-0.5">
                    {srv.version}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted mt-0.5">{srv.endpoint}</p>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase ${
                  srv.circuitBreaker === "OPEN"
                    ? "bg-fail/20 text-fail border border-fail/40"
                    : "bg-pass/10 text-pass border border-pass/30"
                }`}
              >
                {srv.circuitBreaker === "OPEN" ? "Trip / Open" : "Healthy"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px] font-mono">
              <span className="text-muted">Latency:</span>
              <span className="font-semibold text-fg">{srv.latencyMs}ms</span>
              <span className="text-muted">RPS:</span>
              <span className="text-fg">{srv.requestsPerSec}/s</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-muted">Uptime: {srv.uptimePercentage}%</span>
              {srv.circuitBreaker === "OPEN" ? (
                <button
                  type="button"
                  onClick={() => resetCircuitBreaker(srv.serviceId)}
                  className="font-mono font-semibold text-pass hover:underline"
                >
                  Reset Breaker
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => tripCircuitBreaker(srv.serviceId)}
                  className="font-mono text-muted hover:text-fail transition-colors"
                >
                  Test Failover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
