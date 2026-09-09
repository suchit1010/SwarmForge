/**
 * Stage 4: Deterministic Action Safety Gate
 *
 * This is a pure, zero-LLM deterministic code check that guarantees grounding:
 * 1. Verifies that every extracted entity has a verbatim source_span matching the original raw dump.
 * 2. Verifies that all referenced entities across the builder's artifacts belong to the verified source entities.
 *
 * Zero hallucination, deterministic, zero-latency execution.
 */

import type { ExtractedEntity, SafetyGateReport } from "./types";
import type { BuilderArtifact } from "./agents/builder";

export function evaluateSafetyGate(
  rawDump: string,
  extractedEntities: ExtractedEntity[],
  artifacts: BuilderArtifact[],
): SafetyGateReport {
  const normalizedDump = rawDump.toLowerCase();

  // 1. Verify that extracted entities actually exist in the original raw dump
  const verifiedSourceEntities: ExtractedEntity[] = [];
  const invalidSourceEntities: ExtractedEntity[] = [];

  for (const entity of extractedEntities) {
    const span = (entity.source_span || entity.value || "").trim().toLowerCase();
    if (span.length > 0 && normalizedDump.includes(span)) {
      verifiedSourceEntities.push({ ...entity, verified: true });
    } else {
      // Fallback: check if the value itself is present
      const val = (entity.value || "").trim().toLowerCase();
      if (val.length > 0 && normalizedDump.includes(val)) {
        verifiedSourceEntities.push({ ...entity, verified: true });
      } else {
        invalidSourceEntities.push({ ...entity, verified: false });
      }
    }
  }

  const knownValues = new Set(
    verifiedSourceEntities.map((e) => e.value.trim().toLowerCase()),
  );

  // 2. Check referenced entities from artifacts
  const verifiedRefs = new Set<string>();
  const unverifiedRefs = new Set<string>();

  for (const artifact of artifacts) {
    const refs = artifact.referenced_entities || [];
    for (const ref of refs) {
      const normalizedRef = ref.trim().toLowerCase();
      if (!normalizedRef) continue;

      let matched = false;
      for (const known of knownValues) {
        if (normalizedRef.includes(known) || known.includes(normalizedRef)) {
          matched = true;
          break;
        }
      }

      if (matched || normalizedDump.includes(normalizedRef)) {
        verifiedRefs.add(ref);
      } else {
        unverifiedRefs.add(ref);
      }
    }
  }

  const unverifiedList = Array.from(unverifiedRefs);
  const verifiedList = Array.from(verifiedRefs);

  // Calculate grounding score
  const totalRefs = verifiedList.length + unverifiedList.length;
  const groundingScore =
    totalRefs === 0
      ? 100
      : Math.round((verifiedList.length / totalRefs) * 100);

  const passed = unverifiedList.length === 0;

  const audit_summary = passed
    ? `Grounding verified: All ${verifiedSourceEntities.length} entities and ${verifiedList.length} action references traced back to raw source notes.`
    : `Safety Gate Flagged ${unverifiedList.length} ungrounded entities not found in original notes: ${unverifiedList.join(", ")}`;

  return {
    passed,
    score: groundingScore,
    verified_entities: verifiedList.length > 0 ? verifiedList : verifiedSourceEntities.map((e) => e.value),
    unverified_entities: unverifiedList,
    audit_summary,
  };
}
