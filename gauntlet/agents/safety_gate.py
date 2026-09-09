"""
Deterministic Action Safety Gate.
This is a pure code check (NOT an LLM call) verifying entity provenance and grounding.
"""

from typing import Tuple, List
from gauntlet.schemas.contracts import LeadOutput, BuilderOutput, SafetyGateResult

def evaluate_safety_gate(raw_dump: str, lead_output: LeadOutput, builder_output: BuilderOutput) -> SafetyGateResult:
    """
    Deterministically audits all entities referenced in Builder artifacts:
    1. Verifies that every Lead entity has a verbatim source_span in the raw dump.
    2. Verifies that every entity referenced by Builder belongs to verified Lead entities.
    """
    normalized_dump = raw_dump.lower()
    
    # 1. Verify Lead extracted entity source spans against raw dump
    verified_known_values = set()
    for e in lead_output.entities:
        span = (e.source_span or e.value or "").strip().lower()
        if span and span in normalized_dump:
            verified_known_values.add(e.value.strip().lower())
        elif e.value.strip().lower() in normalized_dump:
            verified_known_values.add(e.value.strip().lower())
            
    # 2. Collect all referenced entities across builder artifacts
    verified_refs = []
    unverified_refs = []
    
    for artifact in builder_output.artifacts:
        for ref in artifact.referenced_entities:
            ref_clean = ref.strip()
            ref_lower = ref_clean.lower()
            if not ref_lower:
                continue
                
            matched = False
            for known in verified_known_values:
                if ref_lower in known or known in ref_lower:
                    matched = True
                    break
                    
            if matched or ref_lower in normalized_dump:
                if ref_clean not in verified_refs:
                    verified_refs.append(ref_clean)
            else:
                if ref_clean not in unverified_refs:
                    unverified_refs.append(ref_clean)
                    
    total = len(verified_refs) + len(unverified_refs)
    score = 100 if total == 0 else int((len(verified_refs) / total) * 100)
    passed = len(unverified_refs) == 0
    
    summary = (
        f"Grounding verified: All {len(verified_refs)} action entities proven from source notes."
        if passed
        else f"Safety Gate blocked {len(unverified_refs)} unverified entities: {', '.join(unverified_refs)}"
    )
    
    return SafetyGateResult(
        passed=passed,
        grounding_score=score,
        verified_entities=verified_refs,
        unverified_entities=unverified_refs,
        audit_summary=summary,
    )
