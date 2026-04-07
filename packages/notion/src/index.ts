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
import { createAuthProvider } from "@vineethnkrishnan/oauth-core";
import { AUTH_CONFIG } from "./auth-config";
import { NotionService } from "./services/notion.service";
import { SearchTools, SearchToolSchemas } from "./tools/search.tools";
import { PageTools, PageToolSchemas } from "./tools/page.tools";
import { DatabaseTools, DatabaseToolSchemas } from "./tools/database.tools";
import { UserTools, UserToolSchemas } from "./tools/user.tools";
import { PageWriteTools, PageWriteToolSchemas } from "./tools/page.write-tools";

// Route CLI subcommands before starting MCP server
if (process.argv[2] === "auth") {
  createAuthProvider(AUTH_CONFIG).handleCli(process.argv.slice(3));
} else {
  const auth = createAuthProvider(AUTH_CONFIG);

  const notionService = new NotionService({
    tokenProvider: auth,
    notionVersion: process.env.NOTION_VERSION ?? "2022-06-28",
  });

  // Initialize tool classes
  const tools = {
    search: new SearchTools(notionService),
    pages: new PageTools(notionService),
    pageWrite: new PageWriteTools(notionService),
    databases: new DatabaseTools(notionService),
    users: new UserTools(notionService),
  };

  // Combine all schemas
  const AllToolSchemas = {
    ...SearchToolSchemas,
    ...PageToolSchemas,
    ...PageWriteToolSchemas,
    ...DatabaseToolSchemas,
    ...UserToolSchemas,
  } as const;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version } = require("../package.json");

  const server = new Server({ name: "notion-mcp", version }, { capabilities: { tools: {} } });

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

  type ToolHandler = (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;

  const toolRegistry: Record<string, ToolHandler> = {};
  for (const name of Object.keys(SearchToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.search[name as keyof typeof tools.search] as ToolHandler)(args);
  }
  for (const name of Object.keys(PageToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.pages[name as keyof typeof tools.pages] as ToolHandler)(args);
  }
  for (const name of Object.keys(PageWriteToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.pageWrite[name as keyof typeof tools.pageWrite] as ToolHandler)(args);
  }
  for (const name of Object.keys(DatabaseToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.databases[name as keyof typeof tools.databases] as ToolHandler)(args);
  }
  for (const name of Object.keys(UserToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.users[name as keyof typeof tools.users] as ToolHandler)(args);
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

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Notion MCP Server running on stdio");
  }

  main().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
