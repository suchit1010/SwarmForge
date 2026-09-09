/**
 * IntegrationsPanel — Production Tools & APIs Management Drawer
 *
 * Real connection and synchronization for:
 * 1. Google Workspace (Gmail, Calendar, Tasks)
 * 2. Slack (Web API & Webhooks)
 * 3. Atlassian Jira Cloud (REST API v3)
 *
 * Provides live testing, credential management, and 1-click sync to Loki Neural Memory.
 */

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  MessageSquare,
  Plug,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGauntlet } from "@/lib/gauntlet/store";
import { SlackConnector } from "@/lib/integrations/slack/connector";
import { JiraConnector } from "@/lib/integrations/jira/connector";
import { useIntegrations } from "@/lib/integrations/store";
import { ingestMemory } from "@/lib/memory";
import { useMemory } from "@/lib/memory";

const slackConnector = new SlackConnector();
const jiraConnector = new JiraConnector();

export function IntegrationsPanel({ onClose }: { onClose: () => void }) {
  const apiKey = useGauntlet((s) => s.apiKey);
  const addEntry = useMemory((s) => s.addEntry);
  const upsertNodes = useMemory((s) => s.upsertNodes);
  const upsertEdges = useMemory((s) => s.upsertEdges);

  const { slack, jira, google, setSlackConfig, setJiraConfig, setGoogleConfig, disconnect } = useIntegrations();

  // Active accordion/tab
  const [expanded, setExpanded] = useState<"google" | "slack" | "jira" | null>("slack");

  // Form states
  const [slackToken, setSlackToken] = useState(slack.token);
  const [slackWebhook, setSlackWebhook] = useState(slack.webhookUrl);
  const [slackChannel, setSlackChannel] = useState(slack.defaultChannel || "#general");
  const [showSlackToken, setShowSlackToken] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [syncingSlack, setSyncingSlack] = useState(false);

  const [jiraDomain, setJiraDomain] = useState(jira.domain);
  const [jiraEmail, setJiraEmail] = useState(jira.email);
  const [jiraToken, setJiraToken] = useState(jira.apiToken);
  const [jiraProject, setJiraProject] = useState(jira.projectKey);
  const [showJiraToken, setShowJiraToken] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [syncingJira, setSyncingJira] = useState(false);

  const [googleToken, setGoogleToken] = useState(google.accessToken);

  // ─── SLACK HANDLERS ────────────────────────────────────────────────
  const handleTestSlack = async () => {
    if (!slackToken && !slackWebhook) {
      toast.error("Please enter a Slack Bot Token (xoxb-...) or Webhook URL.");
      return;
    }
    setTestingSlack(true);
    try {
      const res = await slackConnector.connect(slackToken, slackWebhook);
      if (res.ok) {
        setSlackConfig({
          token: slackToken,
          webhookUrl: slackWebhook,
          defaultChannel: slackChannel,
        });
        toast.success(`Slack connected! Workspace: ${res.teamName || "Active"}`);
      } else {
        toast.error(res.error || "Failed to verify Slack credentials.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Slack connection test failed");
    } finally {
      setTestingSlack(false);
    }
  };

  const handleSyncSlack = async () => {
    if (!slack.token && !slackToken) {
      toast.error("Slack Bot Token required for message syncing.");
      return;
    }
    setSyncingSlack(true);
    try {
      if (slackToken !== slack.token) {
        setSlackConfig({ token: slackToken, defaultChannel: slackChannel });
      }

      const res = await slackConnector.ingest(slackChannel, 10);
      if (!res.ok || !res.items.length) {
        toast.error(res.error || "No new messages found to sync.");
        return;
      }

      let ingestedCount = 0;
      for (const item of res.items) {
        try {
          const ingestRes = await ingestMemory({
            data: {
              rawText: `[Slack ${item.title}] ${item.body}`,
              sourceType: "slack",
              apiKey: apiKey || undefined,
            },
          });
          if (ingestRes.ok) {
            addEntry({
              id: ingestRes.result.memoryId,
              userId: "dev-user",
              createdAt: item.timestamp,
              updatedAt: item.timestamp,
              rawText: `[Slack ${item.title}] ${item.body}`,
              processedSummary: ingestRes.result.summary,
              domain: ingestRes.result.domain,
              embeddingVector: null,
              missionId: null,
              sourceType: "slack",
              tags: ["slack", "sync"],
              isArchived: false,
            });
            if (ingestRes.result.extractedNodes.length) upsertNodes(ingestRes.result.extractedNodes);
            if (ingestRes.result.extractedEdges.length) upsertEdges(ingestRes.result.extractedEdges);
            ingestedCount++;
          }
        } catch {
          // Fallback to direct client entry if Gemini ingest fails
          addEntry({
            id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId: "dev-user",
            createdAt: item.timestamp,
            updatedAt: item.timestamp,
            rawText: item.body,
            processedSummary: item.title,
            domain: item.domain,
            embeddingVector: null,
            missionId: null,
            sourceType: "slack",
            tags: ["slack", "sync"],
            isArchived: false,
          });
          ingestedCount++;
        }
      }

      toast.success(`Synced ${ingestedCount} Slack messages to Neural Memory!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync Slack messages");
    } finally {
      setSyncingSlack(false);
    }
  };

  // ─── JIRA HANDLERS ────────────────────────────────────────────────
  const handleTestJira = async () => {
    if (!jiraDomain || !jiraEmail || !jiraToken) {
      toast.error("Jira domain, email, and API token are all required.");
      return;
    }
    setTestingJira(true);
    try {
      const res = await jiraConnector.connect(jiraDomain, jiraEmail, jiraToken);
      if (res.ok) {
        setJiraConfig({
          domain: jiraDomain,
          email: jiraEmail,
          apiToken: jiraToken,
          projectKey: jiraProject,
        });
        toast.success(`Jira connected! Authenticated as ${res.accountName || jiraEmail}`);
      } else {
        toast.error(res.error || "Failed to verify Jira credentials.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Jira connection test failed");
    } finally {
      setTestingJira(false);
    }
  };

  const handleSyncJira = async () => {
    if (!jira.apiToken && !jiraToken) {
      toast.error("Jira API token required for syncing issues.");
      return;
    }
    setSyncingJira(true);
    try {
      if (jiraToken !== jira.apiToken) {
        setJiraConfig({ domain: jiraDomain, email: jiraEmail, apiToken: jiraToken, projectKey: jiraProject });
      }

      const res = await jiraConnector.ingest(jiraProject, 10);
      if (!res.ok || !res.items.length) {
        toast.error(res.error || "No Jira issues found to sync.");
        return;
      }

      let ingestedCount = 0;
      for (const item of res.items) {
        try {
          const ingestRes = await ingestMemory({
            data: {
              rawText: `[Jira Ticket ${item.title}] ${item.body}`,
              sourceType: "jira",
              apiKey: apiKey || undefined,
            },
          });
          if (ingestRes.ok) {
            addEntry({
              id: ingestRes.result.memoryId,
              userId: "dev-user",
              createdAt: item.timestamp,
              updatedAt: item.timestamp,
              rawText: `[Jira Ticket ${item.title}] ${item.body}`,
              processedSummary: ingestRes.result.summary,
              domain: ingestRes.result.domain,
              embeddingVector: null,
              missionId: null,
              sourceType: "jira",
              tags: ["jira", "ticket"],
              isArchived: false,
            });
            if (ingestRes.result.extractedNodes.length) upsertNodes(ingestRes.result.extractedNodes);
            if (ingestRes.result.extractedEdges.length) upsertEdges(ingestRes.result.extractedEdges);
            ingestedCount++;
          }
        } catch {
          addEntry({
            id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId: "dev-user",
            createdAt: item.timestamp,
            updatedAt: item.timestamp,
            rawText: item.body,
            processedSummary: item.title,
            domain: item.domain,
            embeddingVector: null,
            missionId: null,
            sourceType: "jira",
            tags: ["jira", "ticket"],
            isArchived: false,
          });
          ingestedCount++;
        }
      }

      toast.success(`Synced ${ingestedCount} Jira issues to Neural Memory!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync Jira issues");
    } finally {
      setSyncingJira(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-bg/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Drawer / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
              <Plug className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-tight text-fg">
                Tools & Integrations
              </h2>
              <p className="font-mono text-[11px] text-muted">
                Production API Connectors · Neural Memory Ingestion & Safe Dispatch
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {/* Security Isolation Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border/80 bg-surface-2 p-3 text-xs text-muted">
          <ShieldCheck className="size-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            API tokens are saved securely in browser storage and routed directly to server functions. Action dispatching is permanently protected by the Deterministic Safety Gate.
          </p>
        </div>

        {/* Connectors List */}
        <div className="mt-5 space-y-4">
          {/* ─── 1. SLACK CONNECTOR ─── */}
          <div className={`rounded-xl border transition-all ${slack.enabled ? "border-accent/40 bg-surface" : "border-border bg-surface"}`}>
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpanded(expanded === "slack" ? null : "slack")}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent">
                  <MessageSquare className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-fg">Slack Workspace</span>
                    {slack.enabled ? (
                      <Badge variant="pass" className="text-[10px] font-mono">
                        Connected {slack.teamName ? `· ${slack.teamName}` : ""}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] font-mono">
                        Disconnected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">Sync unread channel threads & dispatch drafted responses</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expanded === "slack" ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
              </div>
            </div>

            {expanded === "slack" && (
              <div className="border-t border-border p-4 pt-3 space-y-3 bg-surface-2/40">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                    Slack Bot User OAuth Token (xoxb-...)
                  </label>
                  <div className="relative mt-1">
                    <Input
                      type={showSlackToken ? "text" : "password"}
                      value={slackToken}
                      onChange={(e) => setSlackToken(e.target.value)}
                      placeholder="xoxb-123456789-..."
                      className="font-mono text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSlackToken(!showSlackToken)}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-fg"
                    >
                      {showSlackToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Default Channel
                    </label>
                    <Input
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      placeholder="#general"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Incoming Webhook (Optional)
                    </label>
                    <Input
                      value={slackWebhook}
                      onChange={(e) => setSlackWebhook(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-accent underline hover:opacity-80"
                  >
                    Create Slack App & Token
                    <ExternalLink className="size-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {slack.enabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          disconnect("slack");
                          setSlackToken("");
                          setSlackWebhook("");
                          toast.info("Slack disconnected.");
                        }}
                        className="text-xs text-fail hover:bg-fail/10"
                      >
                        <Trash2 className="size-3 mr-1" />
                        Disconnect
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTestSlack}
                      disabled={testingSlack}
                      className="text-xs"
                    >
                      {testingSlack ? <LoaderCircle className="size-3 animate-spin mr-1" /> : null}
                      Test Connection
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSyncSlack}
                      disabled={syncingSlack}
                      className="text-xs bg-accent text-accent-fg hover:bg-accent/90"
                    >
                      {syncingSlack ? <LoaderCircle className="size-3 animate-spin mr-1" /> : <RefreshCw className="size-3 mr-1" />}
                      Sync Messages
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── 2. JIRA CLOUD CONNECTOR ─── */}
          <div className={`rounded-xl border transition-all ${jira.enabled ? "border-accent/40 bg-surface" : "border-border bg-surface"}`}>
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpanded(expanded === "jira" ? null : "jira")}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent">
                  <CheckSquare className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-fg">Atlassian Jira Cloud</span>
                    {jira.enabled ? (
                      <Badge variant="pass" className="text-[10px] font-mono">
                        Connected {jira.accountName ? `· ${jira.accountName}` : ""}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] font-mono">
                        Disconnected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">Sync active sprint tickets, blockers & dispatch created issues</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expanded === "jira" ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
              </div>
            </div>

            {expanded === "jira" && (
              <div className="border-t border-border p-4 pt-3 space-y-3 bg-surface-2/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Atlassian Domain
                    </label>
                    <Input
                      value={jiraDomain}
                      onChange={(e) => setJiraDomain(e.target.value)}
                      placeholder="your-company.atlassian.net"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Account Email
                    </label>
                    <Input
                      type="email"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Atlassian API Token
                    </label>
                    <div className="relative mt-1">
                      <Input
                        type={showJiraToken ? "text" : "password"}
                        value={jiraToken}
                        onChange={(e) => setJiraToken(e.target.value)}
                        placeholder="ATATT3xFfGF0..."
                        className="font-mono text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowJiraToken(!showJiraToken)}
                        className="absolute right-2.5 top-2.5 text-muted hover:text-fg"
                      >
                        {showJiraToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Default Project Key (Optional)
                    </label>
                    <Input
                      value={jiraProject}
                      onChange={(e) => setJiraProject(e.target.value)}
                      placeholder="PROJ"
                      className="mt-1 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-accent underline hover:opacity-80"
                  >
                    Generate Atlassian API Token
                    <ExternalLink className="size-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {jira.enabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          disconnect("jira");
                          setJiraToken("");
                          toast.info("Jira disconnected.");
                        }}
                        className="text-xs text-fail hover:bg-fail/10"
                      >
                        <Trash2 className="size-3 mr-1" />
                        Disconnect
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTestJira}
                      disabled={testingJira}
                      className="text-xs"
                    >
                      {testingJira ? <LoaderCircle className="size-3 animate-spin mr-1" /> : null}
                      Test Connection
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSyncJira}
                      disabled={syncingJira}
                      className="text-xs bg-accent text-accent-fg hover:bg-accent/90"
                    >
                      {syncingJira ? <LoaderCircle className="size-3 animate-spin mr-1" /> : <RefreshCw className="size-3 mr-1" />}
                      Sync Issues
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── 3. GOOGLE WORKSPACE CONNECTOR ─── */}
          <div className="rounded-xl border border-border bg-surface">
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpanded(expanded === "google" ? null : "google")}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-accent">
                  <Mail className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-fg">Google Workspace</span>
                    <Badge variant="pass" className="text-[10px] font-mono">
                      Active (OAuth & Web Intent)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">Direct Gmail draft creation, Google Calendar holds, and Google Tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expanded === "google" ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
              </div>
            </div>

            {expanded === "google" && (
              <div className="border-t border-border p-4 pt-3 space-y-3 bg-surface-2/40">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                    OAuth Access Token (Optional for REST API direct dispatch)
                  </label>
                  <Input
                    type="password"
                    value={googleToken}
                    onChange={(e) => {
                      setGoogleToken(e.target.value);
                      setGoogleConfig({ accessToken: e.target.value });
                    }}
                    placeholder="ya29.a0AfH6SM..."
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    When empty, Gauntlet automatically uses Google Web Compose intents (1-click zero-config draft & event creation).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end border-t border-border pt-4">
          <Button onClick={onClose} className="bg-accent text-accent-fg hover:bg-accent/90 text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
