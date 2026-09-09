# Gauntlet → Neural Memory Jarvis: Implementation Plan

## Goal

Evolve Gauntlet from a **single-shot 3-agent mission engine** into a **persistent, proactive personal orchestration layer** — a Jarvis that accumulates context over time, models relationships between people/projects/events as a knowledge graph, surfaces the right context at the moment it's needed, and pre-drafts responses and actions for 1-click approval.

## Architecture Decisions (Confirmed via Interview)

| Decision | Choice |
|---|---|
| **Memory Backend** | Hybrid: Neon Postgres (durable graph) + IndexedDB (offline cache) + Gemini embeddings (semantic recall) |
| **Input Paradigm** | Continuous ingestion — persistent sidebar widget for micro-dumps throughout the day, processed in real-time |
| **Tool Integrations** | Start with real Google Workspace APIs (Gmail, Calendar, Tasks via OAuth2). Build connector architecture for Slack/Jira to wire later. |
| **Proactivity** | Full autonomous agent — proactive alerts + pre-drafted responses/meetings/messages with confirm-before-send gate |
| **Memory Structure** | Relationship Knowledge Graph — people, projects, events as nodes; edges encode relationships, last-contact, meeting frequency |
| **Life Organization** | Single unified stream tagged by domain (personal/professional) with filter toggle |
| **Authentication** | ON — Better Auth (already wired in codebase), required for data isolation and OAuth token storage |

---

## User Review Required

> [!IMPORTANT]
> **Breaking change**: This evolution adds auth, a Postgres database, and new migrations. The current localStorage-only flow will be migrated to a hybrid model. Existing mission data in localStorage will need a one-time import.

> [!IMPORTANT]
> **Google OAuth2 Scopes**: Real Gmail/Calendar/Tasks integration requires setting up Google Cloud Console credentials with these scopes: `gmail.compose`, `calendar.events`, `tasks`. You'll need to create a Google Cloud project and obtain OAuth2 client credentials.

> [!WARNING]
> **Scope is large**. This plan is structured in 6 phases that can each be shipped independently. Phase 1 (Memory + Auth) and Phase 2 (Knowledge Graph) form the MVP. Later phases add real API integrations and proactive intelligence.

---

## Open Questions

> [!IMPORTANT]
> **Google Cloud OAuth Client**: Do you already have a Google Cloud project with OAuth2 credentials set up? If not, we'll need to create one. The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables will be required for real Gmail/Calendar/Tasks API access.

> [!IMPORTANT]
> **Notification Delivery**: For proactive alerts (meeting briefs 15 min before), should we use browser push notifications (requires service worker), or just in-app toast/badge notifications? Push notifications work even when the tab is closed but require user permission.

---

## Proposed Changes

### Phase 1: Neural Memory Layer + Auth Foundation

The backbone — persistent memory entries with auth-scoped data isolation.

---

#### [NEW] [0002_memory.sql](file:///c:/Users/sonis/earn/gemini/migrations/auth/0002_memory.sql)

New Postgres migration for the memory system:

```sql
-- Memory entries: every micro-dump, processed insight, and entity
create table if not exists memory_entries (
  id text not null primary key,
  user_id text not null,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz default current_timestamp not null,
  
  -- Content
  raw_text text not null,           -- original dump/thought
  processed_summary text,           -- Gemini-generated summary
  domain text default 'general',    -- personal | professional | general
  
  -- Embeddings for semantic recall
  embedding_vector jsonb,           -- Gemini text-embedding vector (stored as JSON array)
  
  -- Linking
  mission_id text,                  -- optional link to a full Gauntlet mission
  source_type text default 'dump',  -- dump | slack | jira | calendar | manual
  
  -- Metadata
  tags text[] default '{}',
  is_archived boolean default false
);

-- Knowledge graph nodes
create table if not exists kg_nodes (
  id text not null primary key,
  user_id text not null,
  node_type text not null,          -- person | project | event | topic | tool
  label text not null,              -- display name
  properties jsonb default '{}',    -- flexible metadata (email, role, company, etc.)
  first_seen timestamptz default current_timestamp,
  last_seen timestamptz default current_timestamp,
  mention_count integer default 1
);

-- Knowledge graph edges (relationships)
create table if not exists kg_edges (
  id text not null primary key,
  user_id text not null,
  source_node_id text not null references kg_nodes(id) on delete cascade,
  target_node_id text not null references kg_nodes(id) on delete cascade,
  edge_type text not null,          -- works_with | reports_to | discussed | scheduled | assigned_to
  weight real default 1.0,          -- strength/frequency of relationship
  last_active timestamptz default current_timestamp,
  context text,                     -- latest context for this relationship
  unique(source_node_id, target_node_id, edge_type)
);

-- Proactive alerts queue
create table if not exists alerts (
  id text not null primary key,
  user_id text not null,
  trigger_at timestamptz not null,
  alert_type text not null,         -- meeting_brief | deadline | follow_up | reminder
  title text not null,
  body text,
  context_node_ids text[],          -- kg_node references for context assembly
  related_mission_id text,
  status text default 'pending',    -- pending | delivered | dismissed | acted
  created_at timestamptz default current_timestamp
);

-- OAuth tokens for external tool integrations (per-user)
create table if not exists integration_tokens (
  id text not null primary key,
  user_id text not null,
  provider text not null,           -- google | slack | jira
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  unique(user_id, provider)
);

-- Indexes
create index if not exists memory_user_idx on memory_entries(user_id);
create index if not exists memory_domain_idx on memory_entries(user_id, domain);
create index if not exists memory_created_idx on memory_entries(created_at desc);
create index if not exists kg_nodes_user_idx on kg_nodes(user_id);
create index if not exists kg_nodes_type_idx on kg_nodes(user_id, node_type);
create index if not exists kg_edges_source_idx on kg_edges(source_node_id);
create index if not exists kg_edges_target_idx on kg_edges(target_node_id);
create index if not exists alerts_trigger_idx on alerts(user_id, trigger_at) where status = 'pending';
create index if not exists integration_user_idx on integration_tokens(user_id, provider);
```

---

#### [NEW] [src/lib/memory/types.ts](file:///c:/Users/sonis/earn/gemini/src/lib/memory/types.ts)

TypeScript types for the memory system — `MemoryEntry`, `KGNode`, `KGEdge`, `Alert`, `IntegrationToken`.

#### [NEW] [src/lib/memory/store.ts](file:///c:/Users/sonis/earn/gemini/src/lib/memory/store.ts)

Zustand store for memory state management — holds the active memory stream, knowledge graph cache, pending alerts, and domain filter (`all | professional | personal`).

#### [NEW] [src/lib/memory/ingest.ts](file:///c:/Users/sonis/earn/gemini/src/lib/memory/ingest.ts)

Server function: takes a raw micro-dump, calls Gemini to:
1. Summarize it
2. Extract entities (reusing the Lead agent's entity extraction)
3. Generate an embedding vector via `text-embedding-004`
4. Upsert knowledge graph nodes and edges
5. Create proactive alerts if time-based entities are detected

#### [NEW] [src/lib/memory/recall.ts](file:///c:/Users/sonis/earn/gemini/src/lib/memory/recall.ts)

Server function: semantic recall — given a context query (e.g., "meeting with Sarah"), compute embedding, find top-K similar memory entries, traverse the knowledge graph for related nodes, and return a context bundle.

#### [MODIFY] [__root.tsx](file:///c:/Users/sonis/earn/gemini/src/routes/__root.tsx)

- Add `<AuthProvider>` wrapper (already present but inactive)
- Add `<MemoryProvider>` for the continuous ingestion sidebar state

#### [NEW] [src/routes/login.tsx](file:///c:/Users/sonis/earn/gemini/src/routes/login.tsx)

Login page using Better Auth (email/password + Google OAuth)

#### [NEW] [src/routes/api/auth/$.ts](file:///c:/Users/sonis/earn/gemini/src/routes/api/auth/$.ts)

Auth API route handler for Better Auth

---

### Phase 2: Knowledge Graph + Continuous Ingestion UI

---

#### [NEW] [src/components/gauntlet/memory-sidebar.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/memory-sidebar.tsx)

The persistent sidebar/widget for continuous micro-dumps:
- Quick-input textarea (always visible, like a command palette)
- Auto-tag detection (domain, people, projects)
- Real-time processing indicator
- Recent memory stream below
- Domain filter toggle: `All | Professional | Personal`

#### [NEW] [src/components/gauntlet/knowledge-graph-view.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/knowledge-graph-view.tsx)

Interactive knowledge graph visualization:
- Canvas-based node graph showing people, projects, events
- Edge labels showing relationship types
- Node click → show all related memory entries and context
- Search/filter by node type

#### [NEW] [src/components/gauntlet/context-card.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/context-card.tsx)

A reusable "context brief" card used in meeting alerts and proactive surfaces:
- Person summary (role, company, last contact, meeting frequency)
- Recent relevant memories
- Active Jira tickets/Slack threads (when connected)
- Suggested talking points (Gemini-generated)

#### [MODIFY] [landing.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/landing.tsx)

- Replace the current "starters" grid with a **Today View** dashboard:
  - Upcoming meetings with context cards
  - Pending alerts and action items
  - Recent memory stream
  - Quick dump widget
- Keep the "Start a mission" flow for deep work compilation
- Add domain filter tabs

#### [MODIFY] [mission-board.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/mission-board.tsx)

- Add "Save to Memory" button that ingests mission results into the knowledge graph
- Show related context from memory when viewing a mission (people/projects referenced)

---

### Phase 3: Proactive Intelligence Engine

---

#### [NEW] [src/lib/memory/proactive.ts](file:///c:/Users/sonis/earn/gemini/src/lib/memory/proactive.ts)

Server function: the proactive intelligence engine that:
1. Scans pending alerts where `trigger_at <= now()`
2. For meeting briefs: traverses the KG to assemble a full context brief (who, what, when, history)
3. Calls Gemini to generate:
   - Meeting brief with talking points
   - Pre-drafted follow-up email
   - Suggested calendar holds for next steps
4. Queues the output for the confirm-before-send gate

#### [NEW] [src/components/gauntlet/alert-panel.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/alert-panel.tsx)

Notification panel showing proactive alerts:
- Meeting briefs with expandable context cards
- Pre-drafted actions with approve/edit/dismiss buttons
- Badge count in the header

#### [MODIFY] [action-dispatch-gate.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/action-dispatch-gate.tsx)

Extend the existing confirm-before-send gate to also handle proactively generated actions (not just mission outputs).

---

### Phase 4: Google Workspace Real API Integration

---

#### [NEW] [src/lib/integrations/google/auth.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/google/auth.ts)

Google OAuth2 flow using the stored `integration_tokens`:
- Token refresh logic
- Scope management (gmail.compose, calendar.events, tasks)

#### [NEW] [src/lib/integrations/google/gmail.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/google/gmail.ts)

Real Gmail API client:
- `createDraft()` — creates an actual Gmail draft (not just a compose URL)
- `sendDraft()` — sends a previously created draft
- `listThreads()` — for context ingestion

#### [NEW] [src/lib/integrations/google/calendar.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/google/calendar.ts)

Real Google Calendar API client:
- `createEvent()` — creates calendar events
- `listUpcoming()` — fetches upcoming meetings for proactive briefs
- `getEventAttendees()` — for KG person node enrichment

#### [NEW] [src/lib/integrations/google/tasks.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/google/tasks.ts)

Real Google Tasks API client:
- `createTask()` — creates tasks in Google Tasks
- `listTasks()` — for context and status tracking

#### [NEW] [src/components/gauntlet/integrations-panel.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/integrations-panel.tsx)

Settings panel for managing connected integrations:
- Google Workspace connection status + OAuth flow trigger
- Slack (coming soon) / Jira (coming soon) placeholders
- Token status and scope display

#### [MODIFY] [action-dispatch-gate.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/action-dispatch-gate.tsx)

Replace compose-URL-based dispatch with real API calls when Google is connected:
- "Queue" button → actually creates a Gmail draft via API
- "Create Hold" button → actually creates a Calendar event
- "Add Task" button → actually creates a Google Task

---

### Phase 5: Connector Architecture (Slack / Jira Stubs)

---

#### [NEW] [src/lib/integrations/connector.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/connector.ts)

Plugin interface for external tool connectors:
```typescript
interface ToolConnector {
  id: string;
  name: string;
  icon: string;
  scopes: string[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ingest(): Promise<MemoryEntry[]>;  // pull context
  dispatch(action: DispatchAction): Promise<void>;  // push actions
}
```

#### [NEW] [src/lib/integrations/slack/connector.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/slack/connector.ts)

Slack connector stub implementing `ToolConnector`:
- OAuth2 flow for Slack workspace
- `ingest()` → pull recent DMs/channels for context
- `dispatch()` → send Slack messages

#### [NEW] [src/lib/integrations/jira/connector.ts](file:///c:/Users/sonis/earn/gemini/src/lib/integrations/jira/connector.ts)

Jira connector stub implementing `ToolConnector`:
- OAuth2 flow for Jira Cloud
- `ingest()` → pull assigned tickets, recent comments
- `dispatch()` → create/update tickets, add comments

---

### Phase 6: UI Redesign (Screenshot-Inspired Layout)

This phase applies the dark-mode, multi-column dashboard layout from the reference screenshot to the entire app.

---

#### [MODIFY] [styles.css](file:///c:/Users/sonis/earn/gemini/src/styles.css)

Expand the design tokens to support the reference screenshot's aesthetic:
- Material 3-inspired dark tonal palette (surface containers)
- Expressive typography scale
- Motion easings for micro-animations

#### [MODIFY] [landing.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/landing.tsx)

Transform into the "Today" dashboard with 3-column layout:
- **Left**: Memory sidebar (continuous dump + recent stream)
- **Center**: Today's action items, upcoming meetings with context cards, pending alerts
- **Right**: Knowledge graph mini-view, integration status

#### [MODIFY] [mission-board.tsx](file:///c:/Users/sonis/earn/gemini/src/components/gauntlet/mission-board.tsx)

Apply the 3-panel layout from the screenshot:
- **Left**: Agent pipeline + execution traces (vertical stack)
- **Center**: Synthesized artifacts with tabs, safety gate, dispatch proposals
- **Right**: Critic verdict scorecard with sub-job breakdown

---

## Verification Plan

### Automated Tests

```bash
# Existing tests still pass
npm run typecheck
npm run build
npm run test

# New memory layer tests
npx tsx src/lib/memory/ingest.test.ts
npx tsx src/lib/memory/recall.test.ts

# Auth invariant check
npm run check:auth
```

### Manual Verification

1. **Auth Flow**: Sign up → sign in → verify data isolation (two different users see different memories)
2. **Continuous Ingestion**: Type micro-dumps → verify they appear in memory stream → verify KG nodes created
3. **Semantic Recall**: Dump "meeting with Sarah tomorrow" → later query "Sarah" → verify relevant memories surface
4. **Proactive Alerts**: Create a memory entry with a future datetime → verify alert fires at the right time
5. **Google Workspace** (Phase 4): Connect Google → verify real Gmail drafts are created, real calendar events appear
6. **Knowledge Graph**: After 5-10 dumps mentioning the same people/projects, verify the graph shows meaningful relationships
