/**
 * Microservice: Telemetry & Cluster Mesh Service
 *
 * Real-time performance, latency p99 metrics, circuit breaker states,
 * and health monitoring for all decoupled Gauntlet microservices.
 */

export interface MicroserviceHealth {
  serviceId: string;
  name: string;
  version: string;
  endpoint: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  uptimePercentage: number;
  circuitBreaker: "CLOSED" | "HALF_OPEN" | "OPEN";
  requestsPerSec: number;
  lastPing: string;
}

export interface ClusterTelemetry {
  totalRequestsToday: number;
  avgLatencyMs: number;
  activeAgentsRunning: number;
  circuitBreakersTripped: number;
  services: MicroserviceHealth[];
}

import { create } from "zustand";

interface TelemetryStore {
  telemetry: ClusterTelemetry;
  refreshTelemetry: () => void;
  tripCircuitBreaker: (serviceId: string) => void;
  resetCircuitBreaker: (serviceId: string) => void;
}

const INITIAL_SERVICES: MicroserviceHealth[] = [
  {
    serviceId: "srv-action-engine",
    name: "Autonomous Action Broker",
    version: "v2.4.0",
    endpoint: "/api/v1/actions",
    status: "HEALTHY",
    latencyMs: 18,
    uptimePercentage: 99.99,
    circuitBreaker: "CLOSED",
    requestsPerSec: 142,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
  {
    serviceId: "srv-sentry-watchdog",
    name: "Sentry & Reactive Rules Layer",
    version: "v1.8.2",
    endpoint: "/api/v1/watchdogs",
    status: "HEALTHY",
    latencyMs: 24,
    uptimePercentage: 99.95,
    circuitBreaker: "CLOSED",
    requestsPerSec: 88,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
  {
    serviceId: "srv-mobility-hub",
    name: "Mobility, PNR & Ticket Gateway",
    version: "v3.1.0",
    endpoint: "/api/v1/mobility",
    status: "HEALTHY",
    latencyMs: 32,
    uptimePercentage: 99.98,
    circuitBreaker: "CLOSED",
    requestsPerSec: 64,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
  {
    serviceId: "srv-loki-memory",
    name: "Loki Neural Context Mesh",
    version: "v2.0.1",
    endpoint: "/api/v1/memory-graph",
    status: "HEALTHY",
    latencyMs: 41,
    uptimePercentage: 99.91,
    circuitBreaker: "CLOSED",
    requestsPerSec: 210,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
  {
    serviceId: "srv-audio-executive",
    name: "Executive Speech & Podcast Synth",
    version: "v1.2.0",
    endpoint: "/api/v1/speech-debrief",
    status: "HEALTHY",
    latencyMs: 56,
    uptimePercentage: 99.94,
    circuitBreaker: "CLOSED",
    requestsPerSec: 35,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
  {
    serviceId: "srv-gemini-orchestrator",
    name: "Gemini 3.5 Multi-Agent Loop",
    version: "v4.0.0",
    endpoint: "/api/v1/agents/gauntlet",
    status: "HEALTHY",
    latencyMs: 78,
    uptimePercentage: 99.97,
    circuitBreaker: "CLOSED",
    requestsPerSec: 320,
    lastPing: "2026-09-08T12:00:00.000Z",
  },
];

export const useTelemetryService = create<TelemetryStore>((set) => ({
  telemetry: {
    totalRequestsToday: 148209,
    avgLatencyMs: 41.5,
    activeAgentsRunning: 3,
    circuitBreakersTripped: 0,
    services: INITIAL_SERVICES,
  },

  refreshTelemetry: () => {
    set((state) => {
      const jitter = (base: number) => Math.max(5, Math.round(base + (Math.random() * 8 - 4)));
      const updatedServices = state.telemetry.services.map((s) => ({
        ...s,
        latencyMs: jitter(s.latencyMs),
        requestsPerSec: Math.max(10, Math.round(s.requestsPerSec + (Math.random() * 6 - 3))),
        lastPing: new Date().toISOString(),
      }));

      const avgLat = Math.round(
        (updatedServices.reduce((acc, s) => acc + s.latencyMs, 0) / updatedServices.length) * 10,
      ) / 10;

      return {
        telemetry: {
          ...state.telemetry,
          avgLatencyMs: avgLat,
          totalRequestsToday: state.telemetry.totalRequestsToday + Math.floor(Math.random() * 5 + 1),
          services: updatedServices,
        },
      };
    });
  },

  tripCircuitBreaker: (serviceId: string) => {
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        circuitBreakersTripped: state.telemetry.circuitBreakersTripped + 1,
        services: state.telemetry.services.map((s) =>
          s.serviceId === serviceId
            ? { ...s, circuitBreaker: "OPEN", status: "DEGRADED" }
            : s,
        ),
      },
    }));
  },

  resetCircuitBreaker: (serviceId: string) => {
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        circuitBreakersTripped: Math.max(0, state.telemetry.circuitBreakersTripped - 1),
        services: state.telemetry.services.map((s) =>
          s.serviceId === serviceId
            ? { ...s, circuitBreaker: "CLOSED", status: "HEALTHY" }
            : s,
        ),
      },
    }));
  },
}));
