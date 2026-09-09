"""
ADK Lead Agent — Decomposes raw dump into domain, objective, sub-jobs, and verifiable entity spans.
"""

import json
from gauntlet.schemas.contracts import LeadOutput, PlanItem, ExtractedEntity

LEAD_SYSTEM_PROMPT = """You are the LEAD agent of Gauntlet, a work-finishing autonomous engine.
Analyze the user's raw notes/dump, decompose into concrete sub-jobs, and extract all grounded entities with verbatim source spans.

Rules:
1. Domain: Categorize into a concise context (e.g., "Work ops", "Client inquiry", "Household admin").
2. Objective: Exactly one crisp sentence defining done state.
3. Quality Bar: 3-5 concrete, testable criteria for the Critic.
4. Plan: 2-4 sub-jobs (id: j1, j2, ...), title, and why.
5. Entities: Extract concrete recipients, datetimes, dollar amounts, and action items with exact source_span substring proof.
"""

def parse_lead_response(raw_json_str: str) -> LeadOutput:
    """Parses model JSON output into a validated Pydantic LeadOutput model."""
    data = json.loads(raw_json_str)
    return LeadOutput(
        domain=data.get("domain", "General"),
        objective=data.get("objective", ""),
        quality_bar=data.get("qualityBar", data.get("quality_bar", [])),
        plan=[
            PlanItem(id=p.get("id", f"j{i+1}"), title=p.get("title", ""), why=p.get("why", ""))
            for i, p in enumerate(data.get("plan", []))
        ],
        entities=[
            ExtractedEntity(
                type=e.get("type", "action_item"),
                value=e.get("value", ""),
                source_span=e.get("source_span", e.get("value", ""))
            )
            for e in data.get("entities", [])
        ]
    )
