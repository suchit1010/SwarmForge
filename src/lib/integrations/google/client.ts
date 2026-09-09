/**
 * Google Workspace Real API Dispatch Client
 *
 * Implements real API calls to Google APIs:
 * - Gmail API (v1 `users.drafts.create` / compose)
 * - Google Calendar API (v3 `events.insert`)
 * - Google Tasks API (v1 `tasks.insert`)
 *
 * Provides web-intent fallback urls when running in zero-credential mode.
 */

import { buildGmailComposeUrl, buildGoogleCalendarUrl } from "@/lib/gauntlet/tools/dispatch";
import type { CalendarEventProposal, GmailDraftProposal, TaskProposal } from "@/lib/gauntlet/types";

export type GoogleApiConfig = {
  accessToken?: string;
  clientId?: string;
};

export async function createGmailDraft(
  draft: GmailDraftProposal,
  config?: GoogleApiConfig,
): Promise<{ ok: boolean; draftId?: string; webUrl: string; error?: string }> {
  const webUrl = buildGmailComposeUrl(draft);

  // If user has active OAuth accessToken, call the real Gmail REST API
  if (config?.accessToken) {
    try {
      const emailContent = [
        draft.to ? `To: ${draft.to}` : "",
        `Subject: ${draft.subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        draft.body,
      ]
        .filter(Boolean)
        .join("\r\n");

      // base64url encode
      const raw = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { raw },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { ok: true, draftId: data.id, webUrl };
      }
    } catch {
      // fallback to webUrl
    }
  }

  // Graceful fallback to verified Web Compose url
  return { ok: true, webUrl };
}

export async function createCalendarHold(
  event: CalendarEventProposal,
  config?: GoogleApiConfig,
): Promise<{ ok: boolean; eventId?: string; webUrl: string; error?: string }> {
  const webUrl = buildGoogleCalendarUrl(event);

  if (config?.accessToken) {
    try {
      const now = new Date();
      const startTime = event.start.includes("T") ? event.start : new Date(now.getTime() + 86400000).toISOString();
      const endTime = event.end || new Date(new Date(startTime).getTime() + 3600000).toISOString();

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description || "Created via Gauntlet Loki",
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          location: event.location,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { ok: true, eventId: data.id, webUrl };
      }
    } catch {
      // fallback to webUrl
    }
  }

  return { ok: true, webUrl };
}

export async function createGoogleTask(
  task: TaskProposal,
  config?: GoogleApiConfig,
): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  if (config?.accessToken) {
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          due: task.due,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { ok: true, taskId: data.id };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Failed to create Google Task" };
    }
  }

  return { ok: true };
}
