/**
 * Loki Tool Connector Plugin Interface
 *
 * Extensible standard for external integrations (Google Workspace, Slack, Jira, Notion, GitHub).
 * Each connector supports:
 * 1. Auth / Token management
 * 2. Ingestion (pulling messages/tickets into the neural memory graph)
 * 3. Dispatch (pushing drafts/events/tasks with confirm-before-send gate)
 */

import type { MemoryDomain, SourceType } from "../memory/types";

export type ConnectorStatus = "connected" | "disconnected" | "configuring" | "error";

export type IngestedContextItem = {
  externalId: string;
  sourceType: SourceType;
  title: string;
  body: string;
  domain: MemoryDomain;
  author?: string;
  url?: string;
  timestamp: string;
};

export type DispatchAction =
  | {
      type: "gmail_draft";
      to?: string;
      subject: string;
      body: string;
    }
  | {
      type: "calendar_event";
      title: string;
      start: string;
      end?: string;
      description?: string;
      location?: string;
    }
  | {
      type: "google_task";
      title: string;
      due?: string;
    }
  | {
      type: "slack_message";
      channel: string;
      text: string;
    }
  | {
      type: "jira_issue";
      projectKey: string;
      summary: string;
      description: string;
      issueType?: string;
    };

export interface ToolConnector {
  id: string;
  name: string;
  description: string;
  category: "communication" | "calendar" | "project_management" | "notes";
  iconName: string;
  status: ConnectorStatus;
  scopes: string[];

  /** Trigger authentication / OAuth flow */
  connect(): Promise<{ ok: boolean; authUrl?: string; error?: string }>;

  /** Revoke token and disconnect */
  disconnect(): Promise<{ ok: boolean }>;

  /** Pull latest messages/tickets/events for Neural Memory ingestion */
  ingest(since?: string): Promise<{ ok: boolean; items: IngestedContextItem[]; error?: string }>;

  /** Execute audited action dispatch */
  dispatch(action: DispatchAction): Promise<{ ok: boolean; externalId?: string; error?: string }>;
}
