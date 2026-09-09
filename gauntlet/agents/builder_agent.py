"""
ADK Builder Agent — Produces finished deliverables with explicit referenced entities.
"""

import json
from gauntlet.schemas.contracts import BuilderOutput, BuilderArtifact

BUILDER_SYSTEM_PROMPT = """You are the BUILDER agent of Gauntlet.
Your job is to generate FINISHED, copy-paste ready deliverables for each plan item.

Rules:
1. Produce complete emails with subjects, complete checklists with timeframes, complete talk tracks. No outlines.
2. Bind every entity reference into the `referenced_entities` array for deterministic safety gate auditing.
3. Zero fluff, adult tone, strictly grounded in source notes.
"""

def parse_builder_response(raw_json_str: str) -> BuilderOutput:
    """Parses model JSON output into validated Pydantic BuilderOutput."""
    data = json.loads(raw_json_str)
    artifacts = []
    for i, a in enumerate(data.get("artifacts", [])):
        artifacts.append(
            BuilderArtifact(
                id=a.get("id", f"a{i+1}"),
                job_id=a.get("jobId", a.get("job_id", f"j{i+1}")),
                kind=a.get("kind", "document"),
                title=a.get("title", "Untitled"),
                body=a.get("body", ""),
                referenced_entities=a.get("referenced_entities", [])
            )
        )
    return BuilderOutput(artifacts=artifacts)
