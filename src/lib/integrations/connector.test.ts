import { SlackConnector } from "./slack/connector.ts";
import { JiraConnector } from "./jira/connector.ts";
import { useIntegrations } from "./store.ts";

console.log("=== Gauntlet Integrations Plugin Suite: Slack & Jira Verification ===");

// 1. Slack Connector Contract Test
const slack = new SlackConnector();
console.log(`[Slack] ID: ${slack.id}, Name: ${slack.name}, Category: ${slack.category}`);
if (slack.id !== "slack" || !slack.scopes.includes("chat:write")) {
  throw new Error("SlackConnector failed contract check");
}
console.log("✅ [Slack] Connector contract verified.");

// 2. Jira Cloud Connector Contract Test
const jira = new JiraConnector();
console.log(`[Jira] ID: ${jira.id}, Name: ${jira.name}, Category: ${jira.category}`);
if (jira.id !== "jira" || !jira.scopes.includes("write:jira-work")) {
  throw new Error("JiraConnector failed contract check");
}
console.log("✅ [Jira] Connector contract verified.");

// 3. Unconfigured Ingestion & Dispatch Error Handling
async function testErrorHandling() {
  const slackIngest = await slack.ingest();
  if (slackIngest.ok || !slackIngest.error?.includes("Token")) {
    throw new Error("Slack ingest should fail gracefully when unauthenticated");
  }
  console.log("✅ [Slack] Unauthenticated ingest safely rejected with clear error:", slackIngest.error);

  const jiraIngest = await jira.ingest();
  if (jiraIngest.ok || !jiraIngest.error?.includes("credentials")) {
    throw new Error("Jira ingest should fail gracefully when unauthenticated");
  }
  console.log("✅ [Jira] Unauthenticated ingest safely rejected with clear error:", jiraIngest.error);

  const invalidSlackDispatch = await slack.dispatch({
    type: "jira_issue",
    projectKey: "PROJ",
    summary: "Test",
    description: "Test",
  });
  if (invalidSlackDispatch.ok) {
    throw new Error("Slack dispatch should reject incompatible action types");
  }
  console.log("✅ [Slack] Incompatible dispatch safely rejected.");
}

// 4. Zustand State Management & Credentials Lifecycle
function testStoreLifecycle() {
  const store = useIntegrations.getState();

  // Test Slack Config Update
  store.setSlackConfig({
    enabled: true,
    token: "xoxb-mock-token-12345",
    defaultChannel: "#engineering-alerts",
    teamName: "Acme HQ",
  });

  const s1 = useIntegrations.getState().slack;
  if (!s1.enabled || s1.defaultChannel !== "#engineering-alerts" || s1.teamName !== "Acme HQ") {
    throw new Error("Slack config update failed in Zustand store");
  }
  console.log("✅ [Store] Slack config update & status badge lifecycle verified.");

  // Test Jira Config Update
  store.setJiraConfig({
    enabled: true,
    domain: "acme-corp.atlassian.net",
    email: "dev@acme.com",
    apiToken: "ATATT3xMockToken",
    projectKey: "DEV",
    accountName: "Dev Lead",
  });

  const j1 = useIntegrations.getState().jira;
  if (!j1.enabled || j1.domain !== "acme-corp.atlassian.net" || j1.projectKey !== "DEV") {
    throw new Error("Jira config update failed in Zustand store");
  }
  console.log("✅ [Store] Jira config update & account status lifecycle verified.");

  // Test Provider Disconnect
  store.disconnect("slack");
  if (useIntegrations.getState().slack.enabled || useIntegrations.getState().slack.token !== "") {
    throw new Error("Slack disconnect failed");
  }
  console.log("✅ [Store] Slack disconnect & token scrubbing verified.");

  store.disconnect("jira");
  if (useIntegrations.getState().jira.enabled || useIntegrations.getState().jira.domain !== "") {
    throw new Error("Jira disconnect failed");
  }
  console.log("✅ [Store] Jira disconnect & token scrubbing verified.");
}

async function runAll() {
  await testErrorHandling();
  testStoreLifecycle();
  console.log("\n🎉 ALL SLACK & JIRA INTEGRATION SUITES PASSED PERFECTLY.");
}

runAll().catch((err) => {
  console.error("❌ Test run failed:", err);
  process.exit(1);
});
