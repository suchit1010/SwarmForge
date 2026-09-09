/**
 * Jira Cloud Production Tool Connector
 *
 * Implements the ToolConnector plugin contract with real Atlassian Jira Cloud REST API:
 * - Ingests active sprint issues & tickets into Neural Memory
 * - Dispatches created issues and tickets behind confirm-before-send gate
 */

import type { ConnectorStatus, DispatchAction, IngestedContextItem, ToolConnector } from "../connector.ts";
import { useIntegrations } from "../store.ts";
import { createJiraIssueServerFn, fetchJiraIssuesServerFn, verifyJiraServerFn } from "./server.ts";

export class JiraConnector implements ToolConnector {
  id = "jira";
  name = "Jira Cloud";
  description = "Ingest assigned sprint issues, blockers, and dispatch ticket updates.";
  category = "project_management" as const;
  iconName = "CheckSquare";
  scopes = ["read:jira-work", "write:jira-work", "read:jira-user"];

  get status(): ConnectorStatus {
    const config = useIntegrations.getState().jira;
    return config.enabled ? "connected" : "disconnected";
  }

  async connect(domain?: string, email?: string, apiToken?: string): Promise<{ ok: boolean; accountName?: string; error?: string }> {
    const jiraState = useIntegrations.getState().jira;
    const effectiveDomain = domain || jiraState.domain;
    const effectiveEmail = email || jiraState.email;
    const effectiveToken = apiToken || jiraState.apiToken;

    if (!effectiveDomain || !effectiveEmail || !effectiveToken) {
      return { ok: false, error: "Jira domain, email, and API token are required." };
    }

    const res = await verifyJiraServerFn({
      data: {
        domain: effectiveDomain,
        email: effectiveEmail,
        apiToken: effectiveToken,
      },
    });

    if (res.ok) {
      useIntegrations.getState().setJiraConfig({
        enabled: true,
        domain: effectiveDomain,
        email: effectiveEmail,
        apiToken: effectiveToken,
        accountName: res.displayName || res.emailAddress,
      });
      return { ok: true, accountName: res.displayName || res.emailAddress };
    }

    return { ok: false, error: res.error };
  }

  async disconnect(): Promise<{ ok: boolean }> {
    useIntegrations.getState().disconnect("jira");
    return { ok: true };
  }

  async ingest(projectKey?: string, limit = 15): Promise<{ ok: boolean; items: IngestedContextItem[]; error?: string }> {
    const jiraState = useIntegrations.getState().jira;
    if (!jiraState.domain || !jiraState.email || !jiraState.apiToken) {
      return { ok: false, items: [], error: "Jira credentials are required for syncing." };
    }

    const res = await fetchJiraIssuesServerFn({
      data: {
        domain: jiraState.domain,
        email: jiraState.email,
        apiToken: jiraState.apiToken,
        projectKey: projectKey || jiraState.projectKey || undefined,
        limit,
      },
    });

    if (!res.ok || !res.issues) {
      return { ok: false, items: [], error: res.error || "Failed to fetch Jira issues" };
    }

    const items: IngestedContextItem[] = res.issues.map((iss) => ({
      externalId: iss.key,
      sourceType: "jira",
      title: `${iss.key}: ${iss.summary}`,
      body: `Status: ${iss.status} · Priority: ${iss.priority}${iss.assignee ? ` · Assignee: ${iss.assignee}` : ""}\n\n${iss.description}`,
      domain: "professional",
      author: iss.assignee || "Jira",
      url: iss.url,
      timestamp: iss.updated,
    }));

    useIntegrations.getState().setJiraConfig({
      lastSync: new Date().toISOString(),
      syncCount: items.length,
    });

    return { ok: true, items };
  }

  async dispatch(action: DispatchAction): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    if (action.type !== "jira_issue") {
      return { ok: false, error: "Unsupported action type for Jira connector" };
    }

    const jiraState = useIntegrations.getState().jira;
    if (!jiraState.domain || !jiraState.email || !jiraState.apiToken) {
      return { ok: false, error: "Jira credentials not configured. Please enter your API token in Tools & APIs." };
    }

    const res = await createJiraIssueServerFn({
      data: {
        domain: jiraState.domain,
        email: jiraState.email,
        apiToken: jiraState.apiToken,
        projectKey: action.projectKey || jiraState.projectKey || "PROJ",
        summary: action.summary,
        description: action.description,
        issueType: action.issueType || "Task",
      },
    });

    if (!res.ok || !res.key) {
      return { ok: false, error: res.error || "Failed to create Jira issue" };
    }

    return { ok: true, externalId: res.key };
  }
}
