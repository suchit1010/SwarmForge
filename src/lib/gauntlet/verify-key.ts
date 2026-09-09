/**
 * Server functions to verify Gemini API Key and run multi-parameter diagnostic testing.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getGeminiApiKey,
  verifyGeminiKey,
  verifyGeminiKeyWithDiagnostics,
  type ApiKeyDiagnostics,
} from "./gemini-client";

export const verifyApiKeyServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        apiKey: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; latencyMs?: number; model?: string; error?: string }> => {
    const key = data.apiKey || getGeminiApiKey();
    if (!key) {
      return { ok: false, error: "No API key provided. Please enter a valid Gemini API key." };
    }
    return await verifyGeminiKey(key);
  });

export const verifyApiKeyDiagnosticsServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        apiKey: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ApiKeyDiagnostics> => {
    return await verifyGeminiKeyWithDiagnostics(data.apiKey);
  });

export const checkServerKeyStatusServerFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ hasServerKey: boolean; prefix?: string; model: string }> => {
    const envKey = getGeminiApiKey();
    const hasServerKey = Boolean(envKey && envKey.trim().length > 0);
    const prefix = hasServerKey ? `${envKey!.slice(0, 7)}...` : undefined;
    return {
      hasServerKey,
      prefix,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    };
  });

