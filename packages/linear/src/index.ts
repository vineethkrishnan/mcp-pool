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
import { LinearService } from "./services/linear.service";
import { IssueTools, IssueToolSchemas } from "./tools/issue.tools";
import { ProjectTools, ProjectToolSchemas } from "./tools/project.tools";
import { TeamTools, TeamToolSchemas } from "./tools/team.tools";

// Validate required config
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error("LINEAR_API_KEY environment variable is required.");
  process.exit(1);
}

const linearService = new LinearService({
  apiKey: LINEAR_API_KEY,
});

// Initialize tool classes
const tools = {
  issues: new IssueTools(linearService),
  projects: new ProjectTools(linearService),
  teams: new TeamTools(linearService),
};

// Combine all schemas
const AllToolSchemas = {
  ...IssueToolSchemas,
  ...ProjectToolSchemas,
  ...TeamToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "linear-mcp",
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

for (const name of Object.keys(IssueToolSchemas)) {
  toolRegistry[name] = (args) => (tools.issues[name as keyof IssueTools] as ToolHandler)(args);
}
for (const name of Object.keys(ProjectToolSchemas)) {
  toolRegistry[name] = (args) => (tools.projects[name as keyof ProjectTools] as ToolHandler)(args);
}
for (const name of Object.keys(TeamToolSchemas)) {
  toolRegistry[name] = (args) => (tools.teams[name as keyof TeamTools] as ToolHandler)(args);
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
  console.error("Linear MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
