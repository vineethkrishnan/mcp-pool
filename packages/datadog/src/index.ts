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
import { DatadogService } from "./services/datadog.service";
import { MonitorTools, MonitorToolSchemas } from "./tools/monitor.tools";
import { MonitorWriteTools, MonitorWriteToolSchemas } from "./tools/monitor.write-tools";
import { MetricTools, MetricToolSchemas } from "./tools/metric.tools";
import { EventTools, EventToolSchemas } from "./tools/event.tools";

// Validate required config
const DD_API_KEY = process.env.DD_API_KEY;
const DD_APP_KEY = process.env.DD_APP_KEY;
const DD_SITE = process.env.DD_SITE ?? "datadoghq.com";

if (!DD_API_KEY) {
  console.error("DD_API_KEY environment variable is required.");
  process.exit(1);
}

if (!DD_APP_KEY) {
  console.error("DD_APP_KEY environment variable is required.");
  process.exit(1);
}

// Warn on unknown site values
const KNOWN_SITES = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
  "ap1.datadoghq.com",
  "ddog-gov.com",
];

if (!KNOWN_SITES.includes(DD_SITE)) {
  console.error(
    `Warning: DD_SITE="${DD_SITE}" is not a recognized Datadog site. Known sites: ${KNOWN_SITES.join(", ")}. Proceeding anyway.`,
  );
}

const datadogService = new DatadogService({
  apiKey: DD_API_KEY,
  appKey: DD_APP_KEY,
  site: DD_SITE,
});

// Initialize tool classes
const tools = {
  monitors: new MonitorTools(datadogService),
  monitorWrites: new MonitorWriteTools(datadogService),
  metrics: new MetricTools(datadogService),
  events: new EventTools(datadogService),
};

// Combine all schemas
const AllToolSchemas = {
  ...MonitorToolSchemas,
  ...MonitorWriteToolSchemas,
  ...MetricToolSchemas,
  ...EventToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "datadog-mcp",
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

for (const name of Object.keys(MonitorToolSchemas)) {
  toolRegistry[name] = (args) => (tools.monitors[name as keyof MonitorTools] as ToolHandler)(args);
}
for (const name of Object.keys(MonitorWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.monitorWrites[name as keyof MonitorWriteTools] as ToolHandler)(args);
}
for (const name of Object.keys(MetricToolSchemas)) {
  toolRegistry[name] = (args) => (tools.metrics[name as keyof MetricTools] as ToolHandler)(args);
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
  console.error("Datadog MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
