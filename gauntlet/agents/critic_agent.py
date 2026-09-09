"""
ADK Critic Agent — Adversarial double-blind quality evaluator.
"""

import json
from gauntlet.schemas.contracts import CriticVerdict

CRITIC_SYSTEM_PROMPT = """You are the CRITIC agent of Gauntlet.
You evaluate the built artifacts with harsh double-blind objectivity against the quality bar.

Rules:
1. Grade overall from 0 to 100.
2. passed is true ONLY if score >= 82.
3. Quote verbatim evidence of gaps, missing numbers, or vague statements.
4. If a tired human would still rewrite it, fail it.
"""

def parse_critic_response(raw_json_str: str) -> CriticVerdict:
    """Parses model JSON output into validated Pydantic CriticVerdict."""
    data = json.loads(raw_json_str)
    score = int(data.get("overall", data.get("score", 70)))
    return CriticVerdict(
        score=score,
        passed=score >= 82,
        largest_gap=data.get("largestGap", data.get("largest_gap", "No major gaps found.")),
        next_action=data.get("nextAction", data.get("next_action", "Accept the pack.")),
        gaps=[n.get("gap", "") for n in data.get("notes", []) if isinstance(n, dict)]
    )
