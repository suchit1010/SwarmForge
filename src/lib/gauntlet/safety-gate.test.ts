import { evaluateSafetyGate } from "./safety-gate.ts";
import type { ExtractedEntity } from "./types.ts";
import type { BuilderArtifact } from "./agents/builder.ts";

console.log("=== Gauntlet v2 Action Safety Gate Verification ===");

// TEST 1: Clean Grounded Pass
const rawDump1 = "Priya needs Q3 churn recap before Thursday 09:30 standup. Actual churn is 4.2%.";
const entities1: ExtractedEntity[] = [
  { type: "recipient", value: "Priya", source_span: "Priya" },
  { type: "datetime", value: "Thursday 09:30 standup", source_span: "Thursday 09:30" },
  { type: "amount", value: "4.2%", source_span: "4.2%" },
];
const artifacts1: BuilderArtifact[] = [
  {
    id: "a1",
    jobId: "j1",
    kind: "email",
    title: "Q3 Recap",
    body: "Priya — sending churn numbers: 4.2% for Thursday standup.",
    referenced_entities: ["Priya", "Thursday 09:30 standup", "4.2%"],
  },
];

const res1 = evaluateSafetyGate(rawDump1, entities1, artifacts1);
console.log("Test 1 Result:", res1);
if (!res1.passed || res1.score !== 100) {
  throw new Error("Test 1 failed!");
}
console.log("✅ TEST 1 PASSED: Grounded entities passed with 100% score.\n");

// TEST 2: Hallucination Catch
const artifacts2: BuilderArtifact[] = [
  {
    id: "a2",
    jobId: "j1",
    kind: "email",
    title: "Q3 Recap",
    body: "Priya — let's do a call Tuesday at 3pm regarding the $50,000 contract.",
    referenced_entities: ["Priya", "Tuesday 3pm", "$50,000"],
  },
];

const res2 = evaluateSafetyGate(rawDump1, entities1, artifacts2);
console.log("Test 2 Result:", res2);
if (res2.passed || !res2.unverified_entities.includes("Tuesday 3pm") || !res2.unverified_entities.includes("$50,000")) {
  throw new Error("Test 2 failed to catch hallucinated entities!");
}
console.log("✅ TEST 2 PASSED: Hallucinated entities successfully caught and blocked.");
console.log("\n🎉 ALL SAFETY GATE SUITES VERIFIED.");
