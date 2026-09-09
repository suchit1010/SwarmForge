export const ARTIFACT_KINDS = [
  "email",
  "document",
  "checklist",
  "brief",
  "message",
  "plan",
  "script",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export type MissionStatus =
  | "draft"
  | "running"
  | "idle"
  | "passed"
  | "needs_human"
  | "killed";

/** Agent phase indicator for real-time UI */
export type AgentPhase = "lead" | "builder" | "critic" | "safety_gate" | "dispatch" | "idle";

export type PlanItem = {
  id: string;
  title: string;
  why: string;
};

export type ExtractedEntityType = "recipient" | "datetime" | "amount" | "action_item";

export type ExtractedEntity = {
  type: ExtractedEntityType;
  value: string;
  source_span: string; // verbatim substring from original raw notes
  verified?: boolean;
};

export type Artifact = {
  id: string;
  jobId: string;
  kind: ArtifactKind;
  title: string;
  body: string;
  referenced_entities?: string[];
};

export type CriticNote = {
  jobId: string;
  score: number;
  gap: string;
  evidence: string;
};

export type CriticReport = {
  overall: number;
  verdict: "pass" | "fail" | "needs_human";
  notes: CriticNote[];
  largestGap: string;
  nextAction: string;
};

export type SafetyGateReport = {
  passed: boolean;
  score: number; // 0-100% grounded
  verified_entities: string[];
  unverified_entities: string[];
  audit_summary: string;
};

export type GmailDraftProposal = {
  id: string;
  to?: string;
  subject: string;
  body: string;
};

export type CalendarEventProposal = {
  id: string;
  title: string;
  start: string; // ISO or readable string
  end?: string;
  description?: string;
  location?: string;
};

export type TaskProposal = {
  id: string;
  title: string;
  due?: string;
};

export type DispatchProposal = {
  gmailDrafts: GmailDraftProposal[];
  calendarEvents: CalendarEventProposal[];
  tasks: TaskProposal[];
};

export type TraceEvent = {
  id: string;
  at: number;
  agent: "lead" | "builder" | "critic" | "safety_gate" | "dispatch" | "system";
  title: string;
  detail: string;
};

/** Image attachment for multimodal Gemini input */
export type Attachment = {
  id: string;
  mimeType: string;
  data: string; // base64
  preview: string; // data URL for thumbnail display
};

export type ExecutionMetrics = {
  agentCalls: number;
  latencyMs: number;
  costUsd: number;
  model: string;
};

export type Mission = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: MissionStatus;
  round: number;
  maxRounds: number;
  dump: string;
  goal: string;
  domain: string;
  objective: string;
  qualityBar: string[];
  plan: PlanItem[];
  entities: ExtractedEntity[];
  artifacts: Artifact[];
  traces: TraceEvent[];
  critic: CriticReport | null;
  safetyGate: SafetyGateReport | null;
  dispatch: DispatchProposal | null;
  metrics?: ExecutionMetrics | null;
  error: string | null;
  /** Image attachments for multimodal input */
  attachments: Attachment[];
};

export type RoundResult = {
  domain: string;
  objective: string;
  qualityBar: string[];
  plan: PlanItem[];
  entities: ExtractedEntity[];
  artifacts: Artifact[];
  critic: CriticReport;
  safetyGate: SafetyGateReport;
  dispatch: DispatchProposal;
  metrics?: ExecutionMetrics;
  traces: TraceEvent[];
};

