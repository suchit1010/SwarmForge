"""
Pydantic Schema Contracts for Gauntlet Multi-Agent System.
Defines strict validation boundaries for Lead, Builder, Critic, and Safety Gate.
"""

from typing import Literal, List, Optional
from pydantic import BaseModel, Field

class ExtractedEntity(BaseModel):
    type: Literal["recipient", "datetime", "amount", "action_item"]
    value: str = Field(..., description="Normalized string value of the entity")
    source_span: str = Field(..., description="Verbatim exact substring from original notes for grounding proof")

class PlanItem(BaseModel):
    id: str = Field(..., description="Unique sub-job identifier (j1, j2, ...)")
    title: str = Field(..., description="Descriptive task title")
    why: str = Field(..., description="Rationale and problem solved by this sub-job")

class LeadOutput(BaseModel):
    domain: str = Field(..., description="Inferred domain/context of the dump")
    objective: str = Field(..., description="One sentence summary of done state")
    quality_bar: List[str] = Field(..., description="3-5 concrete testable criteria")
    plan: List[PlanItem] = Field(..., description="2-4 sub-jobs to be built")
    entities: List[ExtractedEntity] = Field(..., description="Grounding entities with verbatim source spans")

class BuilderArtifact(BaseModel):
    id: str
    job_id: str
    kind: Literal["email", "document", "checklist", "brief", "message", "plan", "script"]
    title: str
    body: str
    referenced_entities: List[str] = Field(default_factory=list, description="Entities used in this artifact")

class BuilderOutput(BaseModel):
    artifacts: List[BuilderArtifact]

class CriticVerdict(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall quality score")
    passed: bool = Field(..., description="True if score >= 82")
    largest_gap: str = Field(..., description="Single biggest missing element or failure")
    next_action: str = Field(..., description="Clear instruction for what to do or fix")
    gaps: List[str] = Field(default_factory=list, description="Direct quotes of weaknesses or missing facts")

class SafetyGateResult(BaseModel):
    passed: bool
    grounding_score: int
    verified_entities: List[str]
    unverified_entities: List[str]
    audit_summary: str
