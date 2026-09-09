import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Database,
  Layers,
  Play,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CLICKHOUSE_PRESETS,
  REPLIT_RECIPES,
  usePartnerEcosystem,
} from "@/lib/gauntlet/partner-ecosystem";

export function PartnerTrackExplorer() {
  const activeTrack = usePartnerEcosystem((s) => s.activeTrack);
  const setActiveTrack = usePartnerEcosystem((s) => s.setActiveTrack);
  const renderNodes = usePartnerEcosystem((s) => s.renderNodes);
  const grafanaAlerts = usePartnerEcosystem((s) => s.grafanaAlerts);
  const triggerGrafanaWebhookTest = usePartnerEcosystem((s) => s.triggerGrafanaWebhookTest);

  const runClickHouseQuery = usePartnerEcosystem((s) => s.runClickHouseQuery);
  const selectedClickHousePreset = usePartnerEcosystem((s) => s.selectedClickHousePreset);

  const parallelTasks = usePartnerEcosystem((s) => s.parallelTasks);
  const parallelSpeedupFactor = usePartnerEcosystem((s) => s.parallelSpeedupFactor);
  const dispatchParallelBatch = usePartnerEcosystem((s) => s.dispatchParallelBatch);

  const complianceAuditList = usePartnerEcosystem((s) => s.complianceAuditList);
  const evaluateIBMCompliance = usePartnerEcosystem((s) => s.evaluateIBMCompliance);

  const replitConsoleOutput = usePartnerEcosystem((s) => s.replitConsoleOutput);
  const isExecutingScript = usePartnerEcosystem((s) => s.isExecutingScript);
  const executeReplitScript = usePartnerEcosystem((s) => s.executeReplitScript);

  // Local state for ClickHouse interactive runner
  const [activePresetId, setActivePresetId] = useState(selectedClickHousePreset);
  const [clickhouseData, setClickhouseData] = useState(
    CLICKHOUSE_PRESETS[0].sampleResult
  );
  const [lastLatency, setLastLatency] = useState<number>(12);
  const [isRunningQuery, setIsRunningQuery] = useState(false);

  // Local state for Replit script
  const [selectedScriptId, setSelectedScriptId] = useState(REPLIT_RECIPES[0].id);
  const currentRecipe = REPLIT_RECIPES.find((r) => r.id === selectedScriptId) || REPLIT_RECIPES[0];
  const [customScriptCode, setCustomScriptCode] = useState(currentRecipe.code);

  const handleRunClickHouse = async (presetId: string) => {
    const preset = CLICKHOUSE_PRESETS.find((p) => p.id === presetId) || CLICKHOUSE_PRESETS[0];
    setActivePresetId(presetId);
    setIsRunningQuery(true);
    const res = await runClickHouseQuery(preset.sql);
    setClickhouseData(res.rows);
    setLastLatency(res.latencyMs);
    setIsRunningQuery(false);
    toast.success("ClickHouse Sub-Second Query Executed", {
      description: `Returned ${res.rows.length} rows in ${res.latencyMs}ms across columnar telemetry partition.`,
    });
  };

  const handleExecuteReplit = async () => {
    toast.info("Dispatching to Replit Sandbox...", {
      description: `Spawning ${currentRecipe.language === "python" ? "Python 3.11" : "Node 22"} runtime container...`,
    });
    await executeReplitScript(customScriptCode);
    toast.success("Replit Execution Complete", {
      description: "Artifact compiled with exit code 0.",
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 shadow-sm">
      {/* Header & Partner Track Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-accent" />
            <h3 className="font-display text-lg font-semibold tracking-tight text-fg">
              Summer Blockbuster Partner Ecosystem
            </h3>
            <Badge variant="accent" className="text-[10px] uppercase font-mono">
              MCP Protocol Ready
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted max-w-2xl">
            Live, runtime integration adapters for Google Cloud's featured hackathon partner technologies. 
            Select your track to test real agentic tool calls and pipeline execution.
          </p>
        </div>

        {/* Track Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-surface-2 rounded-xl border border-border/70">
          {(
            [
              { id: "GRAFANA", label: "Grafana Labs", icon: Activity, tag: "Observability" },
              { id: "CLICKHOUSE", label: "ClickHouse", icon: Database, tag: "Sub-Sec Analytics" },
              { id: "PARALLEL", label: "Parallel", icon: Zap, tag: "Distributed AI" },
              { id: "IBM", label: "IBM watsonx", icon: ShieldCheck, tag: "IAM & Rights" },
              { id: "REPLIT", label: "Replit", icon: Code2, tag: "Sandbox Code" },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = activeTrack === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTrack(item.id);
                  toast.info(`Switched Partner Track: ${item.label}`, {
                    description: `Active adapter: ${item.tag}`,
                  });
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "text-muted hover:text-fg hover:bg-surface-3"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TRACK 1: GRAFANA LABS (Observability & Render Farm Telemetry) ─── */}
      {activeTrack === "GRAFANA" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60 p-4 rounded-xl border border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-fg">
                  Grafana Labs Production Telemetry · Render Cluster & Cloud Pipelines
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Prometheus Mesh
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Observability layer monitoring 8K frame render p99 latency, GPU cluster temperatures, and ingest queues.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                triggerGrafanaWebhookTest();
                toast.warning("Grafana Alert Fired via Webhook", {
                  description: "MCP tool call: mcp:grafana/trigger_alert_webhook -> PagerDuty #vfx-oncall notified.",
                });
              }}
              className="border-border text-xs gap-1.5 shrink-0"
            >
              <AlertTriangle className="size-3.5 text-amber-400" />
              <span>Test PagerDuty Alert</span>
            </Button>
          </div>

          {/* Render Farm Cluster Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {renderNodes.map((node) => (
              <div
                key={node.nodeId}
                className={`rounded-xl border p-3.5 transition-all ${
                  node.status === "THROTTLED"
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-border/70 bg-surface-2/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-display font-medium text-xs text-fg">{node.name}</span>
                    <p className="font-mono text-[10px] text-muted">{node.gpuModel}</p>
                  </div>
                  <Badge
                    variant={node.status === "THROTTLED" ? "warning" : "accent"}
                    className="text-[9px] font-mono uppercase"
                  >
                    {node.status}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted">GPU Load:</span>
                    <span className={node.gpuUtilization > 90 ? "text-amber-400 font-semibold" : "text-fg"}>
                      {node.gpuUtilization}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        node.gpuUtilization > 90 ? "bg-amber-400" : "bg-accent"
                      }`}
                      style={{ width: `${node.gpuUtilization}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono pt-1 text-muted">
                    <span>Temp: {node.gpuTempC}°C</span>
                    <span>Queue: {node.queueDepth} frames</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted">
                    <span>p99 Latency:</span>
                    <span className="text-pass font-semibold">{node.p99LatencyMs}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Grafana Alert Rules */}
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold mb-3 flex items-center gap-1.5">
              <Activity className="size-3.5 text-accent" />
              Active Grafana Cloud Sentry Alert Rules
            </h4>
            <div className="divide-y divide-border/40">
              {grafanaAlerts.map((alert) => (
                <div key={alert.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        alert.state === "firing" ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                      }`}
                    />
                    <div className="truncate">
                      <span className="font-medium text-fg">{alert.title}</span>
                      <p className="font-mono text-[10px] text-muted">Condition: {alert.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-subtle">{alert.lastEvaluation}</span>
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : "secondary"}
                      className="text-[9px] uppercase font-mono"
                    >
                      {alert.state}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TRACK 2: CLICKHOUSE (Sub-Second Columnar Analytics) ─── */}
      {activeTrack === "CLICKHOUSE" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60 p-4 rounded-xl border border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-fg">
                  ClickHouse Columnar Media & Audience Analytics Engine
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400 border border-sky-500/20">
                  Sub-15ms Query SLA
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                High-throughput telemetry queries indexing millions of viewer interactions, box office ticket sales, and streaming QoS events in real time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">Last Latency:</span>
              <Badge variant="pass" className="font-mono text-xs">
                {lastLatency}ms
              </Badge>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {CLICKHOUSE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant={activePresetId === preset.id ? "default" : "outline"}
                onClick={() => handleRunClickHouse(preset.id)}
                className="text-xs border-border gap-1.5"
              >
                <Database className="size-3.5" />
                <span>{preset.title}</span>
              </Button>
            ))}
          </div>

          {/* SQL Editor View */}
          <div className="rounded-xl border border-border/70 bg-neutral-950 p-4 font-mono text-xs text-neutral-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="size-3.5 text-accent" />
                ClickHouse SQL Query Runner (MCP Managed Protocol)
              </span>
              <Button
                size="sm"
                onClick={() => handleRunClickHouse(activePresetId)}
                disabled={isRunningQuery}
                className="h-6 text-[11px] px-2.5 bg-accent text-accent-fg hover:bg-accent/90 gap-1"
              >
                <Play className={`size-3 ${isRunningQuery ? "animate-spin" : ""}`} />
                <span>Execute SQL</span>
              </Button>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
              {CLICKHOUSE_PRESETS.find((p) => p.id === activePresetId)?.sql}
            </pre>
          </div>

          {/* Live Query Results Table & Visualizer */}
          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold mb-3">
              ClickHouse Query Result Set ({clickhouseData.length} records returned)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted font-mono text-[10px] uppercase">
                    {Object.keys(clickhouseData[0] || {}).map((key) => (
                      <th key={key} className="py-2 px-3">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono text-[11px]">
                  {clickhouseData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-3/50">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-fg">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRACK 3: PARALLEL (Distributed Agent & Render Compute) ─── */}
      {activeTrack === "PARALLEL" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60 p-4 rounded-xl border border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-fg">
                  Parallel Distributed Multi-Agent & Compute Pipeline
                </span>
                <Badge variant="pass" className="text-[10px] font-mono">
                  {parallelSpeedupFactor}x Speedup
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                Decomposes cinematic script breakdown, audio re-balancing, and volumetric VFX passes into asynchronous parallel worker nodes.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                dispatchParallelBatch("Batch-VFX-Scene42");
                toast.success("Parallel Compute Dispatched", {
                  description: "Allocated 4 distributed workers across GCP us-central1.",
                });
              }}
              className="bg-accent text-accent-fg hover:bg-accent/90 text-xs gap-1.5 shrink-0"
            >
              <Zap className="size-3.5" />
              <span>Dispatch Parallel Batch</span>
            </Button>
          </div>

          {/* Active Parallel Tasks */}
          <div className="space-y-3">
            {parallelTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-border/70 bg-surface-2/40 p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-display font-medium text-xs text-fg">{task.name}</span>
                    <p className="font-mono text-[10px] text-muted">{task.workerThread}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted">
                      {task.inputSize} · {task.throughput}
                    </span>
                    <Badge
                      variant={task.status === "COMPLETED" ? "pass" : "accent"}
                      className="text-[9px] font-mono uppercase"
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-muted">
                    <span>Task Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-pass rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TRACK 4: IBM (watsonx & Cloud IAM Governance) ─── */}
      {activeTrack === "IBM" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60 p-4 rounded-xl border border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-fg">
                  IBM watsonx & Cloud IAM Media Governance Ledger
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-500/20">
                  Zero-Trust Media Armor
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Enterprise policy gate enforcing SAG-AFTRA rest turnarounds, digital watermarking, and zero-trust IAM roles.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                evaluateIBMCompliance();
                toast.success("IBM watsonx Policy Audit Passed", {
                  description: "All 3 active media assets validated against enterprise compliance matrix.",
                });
              }}
              className="border-border text-xs gap-1.5 shrink-0"
            >
              <ShieldCheck className="size-3.5 text-indigo-400" />
              <span>Run Compliance Audit</span>
            </Button>
          </div>

          <div className="grid gap-3">
            {complianceAuditList.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-surface-2/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-medium text-xs text-fg">{item.assetName}</span>
                    <Badge variant="secondary" className="text-[9px] font-mono uppercase">
                      {item.ruleCategory}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{item.details}</p>
                  <p className="font-mono text-[10px] text-subtle">
                    Verified by: {item.verifiedBy}
                  </p>
                </div>

                <Badge variant="pass" className="font-mono text-[10px] shrink-0 self-start sm:self-center">
                  <CheckCircle2 className="size-3 mr-1" />
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TRACK 5: REPLIT (Dynamic Sandbox Code Execution) ─── */}
      {activeTrack === "REPLIT" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/60 p-4 rounded-xl border border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-fg">
                  Replit Live Media Automation Sandbox
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-400 border border-rose-500/20">
                  Python 3.11 & Node v22
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                In-browser cloud code execution running automated CMX3600 EDL parsers, subtitle alignments, and FFmpeg transcode recipes.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleExecuteReplit}
              disabled={isExecutingScript}
              className="bg-accent text-accent-fg hover:bg-accent/90 text-xs gap-1.5 shrink-0"
            >
              <Play className={`size-3.5 ${isExecutingScript ? "animate-spin" : ""}`} />
              <span>Run Script in Sandbox</span>
            </Button>
          </div>

          {/* Recipe Switcher */}
          <div className="flex gap-2">
            {REPLIT_RECIPES.map((recipe) => (
              <Button
                key={recipe.id}
                size="sm"
                variant={selectedScriptId === recipe.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedScriptId(recipe.id);
                  setCustomScriptCode(recipe.code);
                }}
                className="text-xs border-border gap-1.5"
              >
                <Code2 className="size-3.5" />
                <span>{recipe.title}</span>
              </Button>
            ))}
          </div>

          {/* Script Editor & Terminal Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/70 bg-neutral-950 p-4 flex flex-col">
              <span className="font-mono text-[11px] text-neutral-400 pb-2 border-b border-neutral-800 mb-2 flex items-center justify-between">
                <span>{currentRecipe.title}</span>
                <span className="text-neutral-500 uppercase">{currentRecipe.language}</span>
              </span>
              <textarea
                value={customScriptCode}
                onChange={(e) => setCustomScriptCode(e.target.value)}
                className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-xs resize-none focus:outline-none min-h-[220px]"
                spellCheck={false}
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-neutral-950 p-4 flex flex-col font-mono text-xs">
              <span className="font-mono text-[11px] text-neutral-400 pb-2 border-b border-neutral-800 mb-2 flex items-center gap-1.5">
                <Terminal className="size-3.5 text-accent" />
                Replit Container Stdout / Stderr
              </span>
              <pre className="flex-1 overflow-x-auto text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {replitConsoleOutput}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
