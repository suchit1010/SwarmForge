/**
 * Integrations Store — Zustand State Management with Persistent Storage
 *
 * Manages production credentials and connection state for:
 * - Slack (Bot Token `xoxb-...` / Webhook URL / Channel)
 * - Atlassian Jira Cloud (Domain, Email, API Token, Project Key)
 * - Google Workspace (OAuth / Access Token)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SlackConfig = {
  enabled: boolean;
  token: string;
  webhookUrl: string;
  defaultChannel: string;
  teamName?: string;
  botUserId?: string;
  lastSync?: string;
  syncCount?: number;
};

export type JiraConfig = {
  enabled: boolean;
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
  accountName?: string;
  lastSync?: string;
  syncCount?: number;
};

export type GoogleConfig = {
  enabled: boolean;
  accessToken: string;
  lastSync?: string;
};

type IntegrationsState = {
  slack: SlackConfig;
  jira: JiraConfig;
  google: GoogleConfig;

  // Actions
  setSlackConfig: (config: Partial<SlackConfig>) => void;
  setJiraConfig: (config: Partial<JiraConfig>) => void;
  setGoogleConfig: (config: Partial<GoogleConfig>) => void;
  disconnect: (provider: "slack" | "jira" | "google") => void;
};

export const useIntegrations = create<IntegrationsState>()(
  persist(
    (set, get) => ({
      slack: {
        enabled: false,
        token: "",
        webhookUrl: "",
        defaultChannel: "#general",
      },
      jira: {
        enabled: false,
        domain: "",
        email: "",
        apiToken: "",
        projectKey: "",
      },
      google: {
        enabled: true, // Google is pre-enabled for web-intent fallbacks
        accessToken: "",
      },

      setSlackConfig: (patch) => {
        set({
          slack: { ...get().slack, ...patch },
        });
      },

      setJiraConfig: (patch) => {
        set({
          jira: { ...get().jira, ...patch },
        });
      },

      setGoogleConfig: (patch) => {
        set({
          google: { ...get().google, ...patch },
        });
      },

      disconnect: (provider) => {
        if (provider === "slack") {
          set({
            slack: {
              enabled: false,
              token: "",
              webhookUrl: "",
              defaultChannel: "#general",
            },
          });
        } else if (provider === "jira") {
          set({
            jira: {
              enabled: false,
              domain: "",
              email: "",
              apiToken: "",
              projectKey: "",
            },
          });
        } else if (provider === "google") {
          set({
            google: {
              enabled: false,
              accessToken: "",
            },
          });
        }
      },
    }),
    {
      name: "gauntlet_integrations_v1",
    },
  ),
);
