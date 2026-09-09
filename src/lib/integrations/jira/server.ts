/**
 * Jira Cloud Production API Server Functions
 *
 * Direct integration with Atlassian Jira Cloud REST API v3:
 * - /rest/api/3/myself for token & domain verification
 * - /rest/api/3/search for JQL-based real sprint issue ingestion
 * - /rest/api/3/issue for real issue creation
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function normalizeDomain(raw: string): string {
  let d = raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!d.includes(".")) {
    d = `${d}.atlassian.net`;
  }
  return d;
}

function makeBasicAuth(email: string, apiToken: string): string {
  const creds = `${email.trim()}:${apiToken.trim()}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

// Helper to extract text from Atlassian Document Format (ADF)
function extractAdfText(doc: unknown): string {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  if (typeof doc !== "object") return "";

  const record = doc as { content?: unknown[]; text?: string };
  if (record.text) return record.text;
  if (Array.isArray(record.content)) {
    return record.content.map(extractAdfText).filter(Boolean).join(" ");
  }
  return "";
}

// ─── 1. VERIFY JIRA CREDENTIALS ───────────────────────────────────
export const verifyJiraServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        domain: z.string().min(1, "Atlassian Cloud domain is required"),
        email: z.string().email("Valid email is required"),
        apiToken: z.string().min(1, "Atlassian API token is required"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{
    ok: boolean;
    displayName?: string;
    emailAddress?: string;
    accountId?: string;
    error?: string;
  }> => {
    const domain = normalizeDomain(data.domain);
    const authHeader = makeBasicAuth(data.email, data.apiToken);

    try {
      const res = await fetch(`https://${domain}/rest/api/3/myself`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
          return { ok: false, error: "Unauthorized: Please verify your Atlassian email and API token." };
        }
        if (res.status === 404) {
          return { ok: false, error: `Jira domain '${domain}' was not found.` };
        }
        return { ok: false, error: `Jira error (${res.status}): ${errText.slice(0, 150)}` };
      }

      const json = (await res.json()) as {
        displayName?: string;
        emailAddress?: string;
        accountId?: string;
      };

      return {
        ok: true,
        displayName: json.displayName,
        emailAddress: json.emailAddress,
        accountId: json.accountId,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Network error connecting to Jira",
      };
    }
  });

// ─── 2. FETCH REAL JIRA TICKETS FOR INGESTION ─────────────────────
export type JiraIssueItem = {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  updated: string;
  url: string;
};

export const fetchJiraIssuesServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        domain: z.string().min(1),
        email: z.string().email(),
        apiToken: z.string().min(1),
        projectKey: z.string().optional(),
        jql: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(15),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{
    ok: boolean;
    issues?: JiraIssueItem[];
    error?: string;
  }> => {
    const domain = normalizeDomain(data.domain);
    const authHeader = makeBasicAuth(data.email, data.apiToken);

    // Build smart JQL: filter by project or recent activity
    let query = data.jql?.trim();
    if (!query) {
      if (data.projectKey?.trim()) {
        query = `project = "${data.projectKey.trim()}" ORDER BY updated DESC`;
      } else {
        query = "ORDER BY updated DESC";
      }
    }

    try {
      const url = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(query)}&maxResults=${data.limit}&fields=summary,description,status,priority,assignee,updated`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return { ok: false, error: `Jira search failed (${res.status}): ${errText.slice(0, 150)}` };
      }

      const json = (await res.json()) as {
        issues?: {
          key: string;
          fields?: {
            summary?: string;
            description?: unknown;
            status?: { name?: string };
            priority?: { name?: string };
            assignee?: { displayName?: string };
            updated?: string;
          };
        }[];
      };

      const parsed: JiraIssueItem[] = (json.issues || []).map((issue) => {
        const descText = extractAdfText(issue.fields?.description);
        return {
          key: issue.key,
          summary: issue.fields?.summary || "(Untitled Issue)",
          description: descText || "No description provided.",
          status: issue.fields?.status?.name || "Open",
          priority: issue.fields?.priority?.name || "Normal",
          assignee: issue.fields?.assignee?.displayName,
          updated: issue.fields?.updated || new Date().toISOString(),
          url: `https://${domain}/browse/${issue.key}`,
        };
      });

      return { ok: true, issues: parsed };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Error fetching Jira issues",
      };
    }
  });

// ─── 3. CREATE / DISPATCH JIRA ISSUE ──────────────────────────────
export const createJiraIssueServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        domain: z.string().min(1),
        email: z.string().email(),
        apiToken: z.string().min(1),
        projectKey: z.string().min(1, "Project key is required (e.g. PROJ)"),
        summary: z.string().min(1, "Summary is required"),
        description: z.string().min(1, "Description is required"),
        issueType: z.string().default("Task"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{
    ok: boolean;
    key?: string;
    id?: string;
    url?: string;
    error?: string;
  }> => {
    const domain = normalizeDomain(data.domain);
    const authHeader = makeBasicAuth(data.email, data.apiToken);

    try {
      const res = await fetch(`https://${domain}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: data.projectKey.toUpperCase() },
            summary: data.summary,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: data.description }],
                },
              ],
            },
            issuetype: { name: data.issueType },
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return { ok: false, error: `Failed to create Jira issue (${res.status}): ${errText.slice(0, 200)}` };
      }

      const json = (await res.json()) as { key?: string; id?: string };
      return {
        ok: true,
        key: json.key,
        id: json.id,
        url: json.key ? `https://${domain}/browse/${json.key}` : undefined,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to dispatch Jira issue",
      };
    }
  });
