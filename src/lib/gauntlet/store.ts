import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sampleWorkWeek, SAMPLE_ID } from "./sample.ts";
import type { Attachment, Mission, RoundResult } from "./types.ts";

const MAX_MISSIONS = 24;

function now() {
  return Date.now();
}

export function newMissionId() {
  return `gnt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type GauntletState = {
  hasHydrated: boolean;
  apiKey: string;
  missions: Record<string, Mission>;
  setHasHydrated: (v: boolean) => void;
  setApiKey: (key: string) => void;
  installSample: () => Mission;
  createMission: (input: { dump: string; goal: string; attachments?: Attachment[] }) => Mission;
  patchMission: (id: string, patch: Partial<Mission>) => void;
  applyRound: (id: string, result: RoundResult) => void;
  killMission: (id: string) => void;
  deleteMission: (id: string) => void;
};

const DEFAULT_SAMPLE = sampleWorkWeek();

export const useGauntlet = create<GauntletState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      apiKey: "",
      missions: { [SAMPLE_ID]: DEFAULT_SAMPLE },
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setApiKey: (key) => set({ apiKey: key.trim() }),
      installSample: () => {
        const sample = sampleWorkWeek();
        set({
          missions: { ...get().missions, [SAMPLE_ID]: sample },
        });
        return sample;
      },
      createMission: ({ dump, goal, attachments }) => {
        const id = newMissionId();
        const ts = now();
        const mission: Mission = {
          id,
          createdAt: ts,
          updatedAt: ts,
          status: "draft",
          round: 0,
          maxRounds: 3,
          dump: dump.trim(),
          goal: goal.trim(),
          domain: "",
          objective: "",
          qualityBar: [],
          plan: [],
          entities: [],
          artifacts: [],
          traces: [],
          critic: null,
          safetyGate: null,
          dispatch: null,
          error: null,
          attachments: attachments ?? [],
        };
        const missions = { ...get().missions, [id]: mission };
        const ids = Object.values(missions)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((m) => m.id);
        if (ids.length > MAX_MISSIONS) {
          for (const extra of ids.slice(MAX_MISSIONS)) delete missions[extra];
        }
        set({ missions });
        return mission;
      },
      patchMission: (id, patch) => {
        const current = get().missions[id];
        if (!current) return;
        set({
          missions: {
            ...get().missions,
            [id]: { ...current, ...patch, updatedAt: now() },
          },
        });
      },
      applyRound: (id, result) => {
        const current = get().missions[id];
        if (!current) return;
        const round = current.round + 1;
        const passed = result.critic.verdict === "pass";
        const needsHuman = result.critic.verdict === "needs_human";
        const status: Mission["status"] = passed
          ? "passed"
          : needsHuman
            ? "needs_human"
            : round >= current.maxRounds
              ? "idle"
              : "idle";
        set({
          missions: {
            ...get().missions,
            [id]: {
              ...current,
              updatedAt: now(),
              round,
              status,
              domain: result.domain,
              objective: result.objective,
              qualityBar: result.qualityBar,
              plan: result.plan,
              entities: result.entities,
              artifacts: result.artifacts,
              critic: result.critic,
              safetyGate: result.safetyGate,
              dispatch: result.dispatch,
              metrics: result.metrics,
              traces: [...current.traces, ...result.traces],
              error: null,
            },
          },
        });
      },
      killMission: (id) => {
        const current = get().missions[id];
        if (!current) return;
        set({
          missions: {
            ...get().missions,
            [id]: { ...current, status: "killed", updatedAt: now() },
          },
        });
      },
      deleteMission: (id) => {
        const missions = { ...get().missions };
        delete missions[id];
        set({ missions });
      },
    }),
    {
      name: "gauntlet-missions-v2",
      partialize: (s) => ({
        apiKey: s.apiKey,
        missions: Object.fromEntries(
          Object.entries(s.missions).map(([k, m]) => [
            k,
            {
              ...m,
              // Don't persist large base64 attachments to localStorage
              attachments: m.attachments.map((a) => ({
                ...a,
                data: "", // strip base64 data from storage
                preview: a.preview.slice(0, 200), // keep a tiny preview hint
              })),
            },
          ]),
        ),
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state && Object.keys(state.missions).length === 0) {
          state.installSample();
        }
      },
    },
  ),
);

export function listMissions(missions: Record<string, Mission>): Mission[] {
  return Object.values(missions).sort((a, b) => b.updatedAt - a.updatedAt);
}
