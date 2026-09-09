/**
 * Microservice Service Registry & Cloud Deployment Architecture
 *
 * Exposes client endpoints and contracts for microservices:
 * 1. Action Service (/api/actions)
 * 2. Telemetry & Mesh Service (/api/telemetry)
 * 3. Mobility & Logistics Service (/api/mobility)
 * 4. Executive Briefing Service (/api/executive)
 * 5. Watchdog Sentry Service (/api/sentry)
 *
 * Configurable via environment variables for cloud deployment:
 * - ACTION_SERVICE_URL
 * - MOBILITY_SERVICE_URL
 * - SENTRY_SERVICE_URL
 * - LOKI_MESH_URL
 */

export interface MicroserviceConfig {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retryCount: number;
  circuitBreakerThreshold: number;
}

export const CLOUD_MICROSERVICES_REGISTRY: Record<string, MicroserviceConfig> = {
  actionService: {
    name: "autonomous-action-service",
    baseUrl: typeof process !== "undefined" && process.env?.ACTION_SERVICE_URL
      ? process.env.ACTION_SERVICE_URL
      : "/api/v1/actions",
    timeoutMs: 3000,
    retryCount: 3,
    circuitBreakerThreshold: 5,
  },
  mobilityService: {
    name: "mobility-ticket-service",
    baseUrl: typeof process !== "undefined" && process.env?.MOBILITY_SERVICE_URL
      ? process.env.MOBILITY_SERVICE_URL
      : "/api/v1/mobility",
    timeoutMs: 5000,
    retryCount: 2,
    circuitBreakerThreshold: 3,
  },
  sentryService: {
    name: "sentry-watchdog-service",
    baseUrl: typeof process !== "undefined" && process.env?.SENTRY_SERVICE_URL
      ? process.env.SENTRY_SERVICE_URL
      : "/api/v1/watchdogs",
    timeoutMs: 2500,
    retryCount: 3,
    circuitBreakerThreshold: 4,
  },
  lokiMeshService: {
    name: "loki-neural-memory-mesh",
    baseUrl: typeof process !== "undefined" && process.env?.LOKI_MESH_URL
      ? process.env.LOKI_MESH_URL
      : "/api/v1/memory-graph",
    timeoutMs: 4000,
    retryCount: 2,
    circuitBreakerThreshold: 5,
  },
};
