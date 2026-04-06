#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PagerDutyService } from "./services/pagerduty.service";
import { IncidentTools, IncidentToolSchemas } from "./tools/incident.tools";
import { IncidentWriteTools, IncidentWriteToolSchemas } from "./tools/incident.write-tools";
import { ServiceTools, ServiceToolSchemas } from "./tools/service.tools";
import { OncallTools, OncallToolSchemas } from "./tools/oncall.tools";

// Validate required config
const PAGERDUTY_API_KEY = process.env.PAGERDUTY_API_KEY;

if (!PAGERDUTY_API_KEY) {
  console.error("PAGERDUTY_API_KEY environment variable is required.");
  process.exit(1);
}

const pagerDutyService = new PagerDutyService({
  apiKey: PAGERDUTY_API_KEY,
  baseUrl: process.env.PAGERDUTY_BASE_URL ?? "https://api.pagerduty.com",
});

// Initialize tool classes
const tools = {
  incidents: new IncidentTools(pagerDutyService),
  incidentWrites: new IncidentWriteTools(pagerDutyService),
  services: new ServiceTools(pagerDutyService),
  oncalls: new OncallTools(pagerDutyService),
};

// Combine all schemas
const AllToolSchemas = {
  ...IncidentToolSchemas,
  ...IncidentWriteToolSchemas,
  ...ServiceToolSchemas,
  ...OncallToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "pagerduty-mcp",
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
    tools: Object.entries(AllToolSchemas).map(([name, config]) => {
      const tool: Record<string, unknown> = {
        name,
        description: config.description,
        inputSchema: z.toJSONSchema(config.schema),
      };
      if ("annotations" in config) {
        tool.annotations = config.annotations;
      }
      return tool;
    }),
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

for (const name of Object.keys(IncidentToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.incidents[name as keyof IncidentTools] as ToolHandler)(args);
}
for (const name of Object.keys(IncidentWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.incidentWrites[name as keyof IncidentWriteTools] as ToolHandler)(args);
}
for (const name of Object.keys(ServiceToolSchemas)) {
  toolRegistry[name] = (args) => (tools.services[name as keyof ServiceTools] as ToolHandler)(args);
}
for (const name of Object.keys(OncallToolSchemas)) {
  toolRegistry[name] = (args) => (tools.oncalls[name as keyof OncallTools] as ToolHandler)(args);
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
  console.error("PagerDuty MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
