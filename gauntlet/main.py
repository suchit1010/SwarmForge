"""
Gauntlet ADK Entrypoint & Test Verification Suite.
Demonstrates the 6-stage pipeline and executes unit tests for the Action Safety Gate.
"""

from gauntlet.schemas.contracts import LeadOutput, PlanItem, ExtractedEntity, BuilderOutput, BuilderArtifact
from gauntlet.agents.safety_gate import evaluate_safety_gate
from gauntlet.tools.gmail_tool import create_gmail_draft_payload

def test_safety_gate_clean_pass():
    raw_dump = "Priya needs Q3 churn recap before Thursday 09:30 standup. Actual churn is 4.2%."
    lead = LeadOutput(
        domain="Work ops",
        objective="Send status before standup",
        quality_bar=["4.2% churn must be exact"],
        plan=[PlanItem(id="j1", title="Status Email", why="Priya deadline")],
        entities=[
            ExtractedEntity(type="recipient", value="Priya", source_span="Priya"),
            ExtractedEntity(type="datetime", value="Thursday 09:30 standup", source_span="Thursday 09:30"),
            ExtractedEntity(type="amount", value="4.2%", source_span="4.2%"),
        ]
    )
    builder = BuilderOutput(
        artifacts=[
            BuilderArtifact(
                id="a1",
                job_id="j1",
                kind="email",
                title="Q3 Recap",
                body="Priya — sending churn numbers: 4.2% for Thursday standup.",
                referenced_entities=["Priya", "Thursday 09:30 standup", "4.2%"]
            )
        ]
    )
    
    result = evaluate_safety_gate(raw_dump, lead, builder)
    assert result.passed is True, f"Expected clean pass, got: {result.audit_summary}"
    assert result.grounding_score == 100
    print("✅ TEST 1 PASSED: Grounded entities passed with 100% score.")

def test_safety_gate_hallucination_catch():
    raw_dump = "Priya needs Q3 churn recap before Thursday 09:30 standup. Actual churn is 4.2%."
    lead = LeadOutput(
        domain="Work ops",
        objective="Send status before standup",
        quality_bar=["4.2% churn must be exact"],
        plan=[PlanItem(id="j1", title="Status Email", why="Priya deadline")],
        entities=[
            ExtractedEntity(type="recipient", value="Priya", source_span="Priya"),
            ExtractedEntity(type="datetime", value="Thursday 09:30 standup", source_span="Thursday 09:30"),
            ExtractedEntity(type="amount", value="4.2%", source_span="4.2%"),
        ]
    )
    # Builder hallucinates a fake Tuesday 3pm demo and fake $50k invoice
    builder = BuilderOutput(
        artifacts=[
            BuilderArtifact(
                id="a1",
                job_id="j1",
                kind="email",
                title="Q3 Recap",
                body="Priya — let's do a call Tuesday at 3pm regarding the $50,000 contract.",
                referenced_entities=["Priya", "Tuesday 3pm", "$50,000"]
            )
        ]
    )
    
    result = evaluate_safety_gate(raw_dump, lead, builder)
    assert result.passed is False, "Expected safety gate to block hallucinated entities!"
    assert "Tuesday 3pm" in result.unverified_entities
    assert "$50,000" in result.unverified_entities
    print(f"✅ TEST 2 PASSED: Hallucinated entities successfully caught and blocked ({result.audit_summary}).")

def test_gmail_payload_generation():
    payload = create_gmail_draft_payload("priya@company.com", "Q3 Recap", "Here are the numbers.")
    assert payload["userId"] == "me"
    assert "raw" in payload["body"]["message"]
    print("✅ TEST 3 PASSED: Minimal-scope Gmail draft MIME payload generated.")

if __name__ == "__main__":
    print("Running Gauntlet ADK Pipeline Verification Suite...")
    test_safety_gate_clean_pass()
    test_safety_gate_hallucination_catch()
    test_gmail_payload_generation()
    print("\n🎉 ALL 3 ADK STAGES VERIFIED.")
