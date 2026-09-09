/**
 * Stage 5: Google Workspace API & Web Dispatch Helpers
 *
 * Extracts structured dispatch proposals from artifacts & entities:
 * - Gmail Draft / Compose
 * - Google Calendar Event Holds
 * - Google Tasks
 */

import type {
  Artifact,
  CalendarEventProposal,
  DispatchProposal,
  ExtractedEntity,
  GmailDraftProposal,
  TaskProposal,
} from "../types";

export function extractDispatchProposals(
  artifacts: Artifact[],
  entities: ExtractedEntity[],
): DispatchProposal {
  const gmailDrafts: GmailDraftProposal[] = [];
  const calendarEvents: CalendarEventProposal[] = [];
  const tasks: TaskProposal[] = [];

  // Extract Emails / Messages
  for (const a of artifacts) {
    if (a.kind === "email" || a.kind === "message") {
      let subject = a.title;
      let body = a.body;
      let to: string | undefined = undefined;

      // Extract subject line if present in body
      const subjectMatch = a.body.match(/^(?:Subject|Subj):\s*(.+)$/im);
      if (subjectMatch?.[1]) {
        subject = subjectMatch[1].trim();
        body = body.replace(/^(?:Subject|Subj):\s*.+$\n*/im, "").trim();
      }

      // Check for recipient in entities or greeting
      const recipientEntity = entities.find((e) => e.type === "recipient");
      if (recipientEntity) {
        to = recipientEntity.value;
      }

      gmailDrafts.push({
        id: `draft_${a.id}`,
        to,
        subject,
        body,
      });
    }

    // Extract Plan / Timeline items for Calendar
    if (a.kind === "plan") {
      const lines = a.body.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || "";
        // Match day/time formats like "Tue • 09:00–09:25 — PAY-441" or "Thursday 16:30 — Dentist"
        if (/^(?:[A-Z][a-z]{2,8}|\d{1,2}[:.]\d{2}|[•\-*]\s*\d{1,2}[:.]\d{2})/i.test(line) && line.length > 5) {
          calendarEvents.push({
            id: `cal_${a.id}_${i}`,
            title: line.replace(/^[•\-*]\s*/, "").slice(0, 80),
            start: line.slice(0, 30),
            description: a.title,
          });
        }
      }
    }

    // Extract Checklist items for Tasks
    if (a.kind === "checklist") {
      const lines = a.body.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || "";
        if (/^(?:\d+[.)]|-|\*|\[\s*\])\s+/.test(line)) {
          const itemText = line.replace(/^(?:\d+[.)]|-|\*|\[\s*\])\s+/, "").trim();
          if (itemText.length > 3) {
            tasks.push({
              id: `task_${a.id}_${i}`,
              title: itemText.slice(0, 120),
            });
          }
        }
      }
    }
  }

  // Fallback: If no calendar events found from plan, use datetime entities
  if (calendarEvents.length === 0) {
    const dateEntities = entities.filter((e) => e.type === "datetime");
    for (let i = 0; i < dateEntities.length; i++) {
      const d = dateEntities[i]!;
      calendarEvents.push({
        id: `cal_entity_${i}`,
        title: `Hold: ${d.value}`,
        start: d.value,
      });
    }
  }

  return {
    gmailDrafts: gmailDrafts.slice(0, 3),
    calendarEvents: calendarEvents.slice(0, 6),
    tasks: tasks.slice(0, 8),
  };
}

/**
 * Generate a direct Google Calendar template link.
 */
export function buildGoogleCalendarUrl(event: CalendarEventProposal): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(event.title || "Scheduled Hold");
  const details = encodeURIComponent(event.description || "Created via Gauntlet");
  return `${base}&text=${title}&details=${details}`;
}

/**
 * Generate a direct Gmail Web Compose link.
 */
export function buildGmailComposeUrl(draft: GmailDraftProposal): string {
  const base = "https://mail.google.com/mail/?view=cm&fs=1";
  const to = draft.to ? `&to=${encodeURIComponent(draft.to)}` : "";
  const su = `&su=${encodeURIComponent(draft.subject)}`;
  const body = `&body=${encodeURIComponent(draft.body)}`;
  return `${base}${to}${su}${body}`;
}
