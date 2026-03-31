#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { SentryService } from "./services/sentry.service";
import { OrganizationTools, OrganizationToolSchemas } from "./tools/organization.tools";
import { ProjectTools, ProjectToolSchemas } from "./tools/project.tools";
import { IssueTools, IssueToolSchemas } from "./tools/issue.tools";
import { EventTools, EventToolSchemas } from "./tools/event.tools";

// Validate required config
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

if (!SENTRY_AUTH_TOKEN) {
  console.error("SENTRY_AUTH_TOKEN environment variable is required.");
  process.exit(1);
}

const sentryService = new SentryService({
  authToken: SENTRY_AUTH_TOKEN,
  baseUrl: process.env.SENTRY_BASE_URL ?? "https://sentry.io",
  org: process.env.SENTRY_ORG,
});

// Initialize tool classes
const tools = {
  organizations: new OrganizationTools(sentryService),
  projects: new ProjectTools(sentryService),
  issues: new IssueTools(sentryService),
  events: new EventTools(sentryService),
};

// Combine all schemas
const AllToolSchemas = {
  ...OrganizationToolSchemas,
  ...ProjectToolSchemas,
  ...IssueToolSchemas,
  ...EventToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "sentry-mcp",
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Handler for listing available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(AllToolSchemas).map(([name, config]) => ({
      name,
      description: config.description,
      inputSchema: config.schema,
    })),
  };
});

/**
 * Handler for calling specific tools.
 */
type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

const toolRegistry: Record<string, ToolHandler> = {};

for (const name of Object.keys(OrganizationToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.organizations[name as keyof OrganizationTools] as ToolHandler)(args);
}
for (const name of Object.keys(ProjectToolSchemas)) {
  toolRegistry[name] = (args) => (tools.projects[name as keyof ProjectTools] as ToolHandler)(args);
}
for (const name of Object.keys(IssueToolSchemas)) {
  toolRegistry[name] = (args) => (tools.issues[name as keyof IssueTools] as ToolHandler)(args);
}
for (const name of Object.keys(EventToolSchemas)) {
  toolRegistry[name] = (args) => (tools.events[name as keyof EventTools] as ToolHandler)(args);
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const handler = toolRegistry[name];

    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }

    return await handler(args ?? {});
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server using Stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sentry MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
