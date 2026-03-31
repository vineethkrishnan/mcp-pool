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
import { NotionService } from "./services/notion.service";
import { SearchTools, SearchToolSchemas } from "./tools/search.tools";
import { PageTools, PageToolSchemas } from "./tools/page.tools";
import { DatabaseTools, DatabaseToolSchemas } from "./tools/database.tools";
import { UserTools, UserToolSchemas } from "./tools/user.tools";

// Validate required config
const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  console.error("NOTION_API_KEY environment variable is required.");
  process.exit(1);
}

const notionService = new NotionService({
  apiKey: NOTION_API_KEY,
  notionVersion: process.env.NOTION_VERSION ?? "2022-06-28",
});

// Initialize tool classes
const tools = {
  search: new SearchTools(notionService),
  pages: new PageTools(notionService),
  databases: new DatabaseTools(notionService),
  users: new UserTools(notionService),
};

// Combine all schemas
const AllToolSchemas = {
  ...SearchToolSchemas,
  ...PageToolSchemas,
  ...DatabaseToolSchemas,
  ...UserToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "notion-mcp",
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

for (const name of Object.keys(SearchToolSchemas)) {
  toolRegistry[name] = (args) => (tools.search[name as keyof SearchTools] as ToolHandler)(args);
}
for (const name of Object.keys(PageToolSchemas)) {
  toolRegistry[name] = (args) => (tools.pages[name as keyof PageTools] as ToolHandler)(args);
}
for (const name of Object.keys(DatabaseToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.databases[name as keyof DatabaseTools] as ToolHandler)(args);
}
for (const name of Object.keys(UserToolSchemas)) {
  toolRegistry[name] = (args) => (tools.users[name as keyof UserTools] as ToolHandler)(args);
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
  console.error("Notion MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
