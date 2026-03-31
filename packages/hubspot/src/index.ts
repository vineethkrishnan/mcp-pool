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
import { HubSpotService } from "./services/hubspot.service";
import { ContactTools, ContactToolSchemas } from "./tools/contact.tools";
import { DealTools, DealToolSchemas } from "./tools/deal.tools";
import { CompanyTools, CompanyToolSchemas } from "./tools/company.tools";

// Validate required config
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!HUBSPOT_ACCESS_TOKEN) {
  console.error("HUBSPOT_ACCESS_TOKEN environment variable is required.");
  process.exit(1);
}

const hubspotService = new HubSpotService({
  accessToken: HUBSPOT_ACCESS_TOKEN,
});

// Initialize tool classes
const tools = {
  contacts: new ContactTools(hubspotService),
  deals: new DealTools(hubspotService),
  companies: new CompanyTools(hubspotService),
};

// Combine all schemas
const AllToolSchemas = {
  ...ContactToolSchemas,
  ...DealToolSchemas,
  ...CompanyToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "hubspot-mcp",
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
      inputSchema: z.toJSONSchema(config.schema),
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

for (const name of Object.keys(ContactToolSchemas)) {
  toolRegistry[name] = (args) => (tools.contacts[name as keyof ContactTools] as ToolHandler)(args);
}
for (const name of Object.keys(DealToolSchemas)) {
  toolRegistry[name] = (args) => (tools.deals[name as keyof DealTools] as ToolHandler)(args);
}
for (const name of Object.keys(CompanyToolSchemas)) {
  toolRegistry[name] = (args) => (tools.companies[name as keyof CompanyTools] as ToolHandler)(args);
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
  console.error("HubSpot MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
