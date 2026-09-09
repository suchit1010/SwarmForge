---
name: gauntlet-architecture
description: Architecture reference for the Gauntlet neural memory system — memory backbone, knowledge graph, integration connectors, and proactive intelligence patterns.
---

# Gauntlet Architecture Reference

## Core Decisions

| Component | Decision |
|---|---|
| Memory Backend | Hybrid: Neon Postgres (durable) + IndexedDB (offline) + Gemini embeddings (semantic recall) |
| Input Model | Continuous micro-dump ingestion, NOT single big-dump sessions |
| Knowledge Graph | Nodes: person, project, event, topic. Edges: works_with, discussed, scheduled, assigned_to |
| Life Organization | Single unified stream tagged by domain, with filter toggle (All / Professional / Personal) |
| Auth | ON — Better Auth with Google OAuth for both login and Google Workspace API access |
| Integrations | Google Workspace first (real APIs), then Slack/Jira via ToolConnector plugin interface |
| Proactivity | Full autonomous — pre-drafts responses, pre-books meetings, always behind confirm-before-send gate |

## Database Schema

- `memory_entries` — every micro-dump with embedding vectors
- `kg_nodes` / `kg_edges` — knowledge graph (relationship model)
- `alerts` — proactive alert queue with trigger times
- `integration_tokens` — per-user OAuth tokens for external tools

## Key Patterns

- Every server function is scoped by `context.userId` via `authMiddleware`
- Gemini `text-embedding-004` for all embedding generation
- KG nodes are upserted on ingestion — same person mentioned twice → same node, incremented `mention_count`
- Alerts are time-triggered, not poll-based — created during ingestion when datetime entities are detected

## Branch

All Jarvis evolution work lives on the `loki` branch.
