/**
 * Slack Production Tool Connector
 *
 * Implements the ToolConnector plugin contract with real Slack API communication:
 * - Channel context ingestion into Neural Memory
 * - Audited message dispatch behind the safety gate
 */

import type { ConnectorStatus, DispatchAction, IngestedContextItem, ToolConnector } from "../connector.ts";
import { useIntegrations } from "../store.ts";
import { fetchSlackMessagesServerFn, postSlackMessageServerFn, verifySlackServerFn } from "./server.ts";

export class SlackConnector implements ToolConnector {
  id = "slack";
  name = "Slack";
  description = "Sync unread messages, channel threads, and dispatch approved messages.";
  category = "communication" as const;
  iconName = "MessageSquare";
  scopes = ["channels:read", "chat:write", "im:read"];

  get status(): ConnectorStatus {
    const config = useIntegrations.getState().slack;
    return config.enabled ? "connected" : "disconnected";
  }

  async connect(token?: string, webhookUrl?: string): Promise<{ ok: boolean; teamName?: string; error?: string }> {
    const slackState = useIntegrations.getState().slack;
    const effectiveToken = token || slackState.token;
    const effectiveWebhook = webhookUrl || slackState.webhookUrl;

    const res = await verifySlackServerFn({
      data: { token: effectiveToken, webhookUrl: effectiveWebhook },
    });

    if (res.ok) {
      useIntegrations.getState().setSlackConfig({
        enabled: true,
        token: effectiveToken,
        webhookUrl: effectiveWebhook,
        teamName: res.teamName,
        botUserId: res.botUserId,
      });
      return { ok: true, teamName: res.teamName };
    }

    return { ok: false, error: res.error };
  }

  async disconnect(): Promise<{ ok: boolean }> {
    useIntegrations.getState().disconnect("slack");
    return { ok: true };
  }

  async ingest(channelNameOrId?: string, limit = 15): Promise<{ ok: boolean; items: IngestedContextItem[]; error?: string }> {
    const slackState = useIntegrations.getState().slack;
    if (!slackState.token) {
      return { ok: false, items: [], error: "Slack Bot Token (xoxb-...) is required for message syncing." };
    }

    const res = await fetchSlackMessagesServerFn({
      data: {
        token: slackState.token,
        channelNameOrId: channelNameOrId || slackState.defaultChannel || "#general",
        limit,
      },
    });

    if (!res.ok || !res.messages) {
      return { ok: false, items: [], error: res.error || "Failed to fetch Slack messages" };
    }

    const items: IngestedContextItem[] = res.messages.map((m) => ({
      externalId: m.id,
      sourceType: "slack",
      title: `${m.channel}: Message from ${m.user}`,
      body: m.text,
      domain: "professional",
      author: m.user,
      timestamp: m.timestamp,
    }));

    useIntegrations.getState().setSlackConfig({
      lastSync: new Date().toISOString(),
      syncCount: items.length,
    });

    return { ok: true, items };
  }

  async dispatch(action: DispatchAction): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    if (action.type !== "slack_message") {
      return { ok: false, error: "Unsupported action type for Slack connector" };
    }

    const slackState = useIntegrations.getState().slack;
    const res = await postSlackMessageServerFn({
      data: {
        token: slackState.token || undefined,
        webhookUrl: slackState.webhookUrl || undefined,
        channel: action.channel || slackState.defaultChannel || "#general",
        text: action.text,
      },
    });

    if (!res.ok) {
      return { ok: false, error: res.error || "Failed to dispatch message to Slack" };
    }

    return { ok: true, externalId: res.ts || `slack_${Date.now()}` };
  }
}
