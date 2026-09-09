-- Loki Neural Memory Layer
-- Memory entries, knowledge graph, proactive alerts, and integration tokens.
-- Scoped per-user via user_id (TEXT, matches Better Auth user.id).

-- ─── Memory Entries ───────────────────────────────────────────────
-- Every micro-dump, processed insight, and ingested context fragment.
create table if not exists memory_entries (
  id text not null primary key,
  user_id text not null,
  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz default current_timestamp not null,

  -- Content
  raw_text text not null,
  processed_summary text,
  domain text default 'general',

  -- Embeddings for semantic recall (Gemini text-embedding-004 vector as JSON array)
  embedding_vector jsonb,

  -- Linking
  mission_id text,
  source_type text default 'dump',

  -- Metadata
  tags text[] default '{}',
  is_archived boolean default false
);

-- ─── Knowledge Graph Nodes ────────────────────────────────────────
create table if not exists kg_nodes (
  id text not null primary key,
  user_id text not null,
  node_type text not null,
  label text not null,
  properties jsonb default '{}',
  first_seen timestamptz default current_timestamp,
  last_seen timestamptz default current_timestamp,
  mention_count integer default 1
);

-- ─── Knowledge Graph Edges ────────────────────────────────────────
create table if not exists kg_edges (
  id text not null primary key,
  user_id text not null,
  source_node_id text not null references kg_nodes(id) on delete cascade,
  target_node_id text not null references kg_nodes(id) on delete cascade,
  edge_type text not null,
  weight real default 1.0,
  last_active timestamptz default current_timestamp,
  context text,
  unique(source_node_id, target_node_id, edge_type)
);

-- ─── Proactive Alerts Queue ───────────────────────────────────────
create table if not exists alerts (
  id text not null primary key,
  user_id text not null,
  trigger_at timestamptz not null,
  alert_type text not null,
  title text not null,
  body text,
  context_node_ids text[],
  related_mission_id text,
  status text default 'pending',
  created_at timestamptz default current_timestamp
);

-- ─── Integration OAuth Tokens ─────────────────────────────────────
create table if not exists integration_tokens (
  id text not null primary key,
  user_id text not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  unique(user_id, provider)
);

-- ─── Indexes ──────────────────────────────────────────────────────
create index if not exists memory_user_idx on memory_entries(user_id);
create index if not exists memory_domain_idx on memory_entries(user_id, domain);
create index if not exists memory_created_idx on memory_entries(created_at desc);
create index if not exists kg_nodes_user_idx on kg_nodes(user_id);
create index if not exists kg_nodes_type_idx on kg_nodes(user_id, node_type);
create index if not exists kg_edges_source_idx on kg_edges(source_node_id);
create index if not exists kg_edges_target_idx on kg_edges(target_node_id);
create index if not exists alerts_trigger_idx on alerts(user_id, trigger_at) where status = 'pending';
create index if not exists integration_user_idx on integration_tokens(user_id, provider);
