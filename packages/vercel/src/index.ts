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
import { VercelService } from "./services/vercel.service";
import { ProjectTools, ProjectToolSchemas } from "./tools/project.tools";
import { DeploymentTools, DeploymentToolSchemas } from "./tools/deployment.tools";
import { DeploymentWriteTools, DeploymentWriteToolSchemas } from "./tools/deployment.write-tools";

// Validate required config
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.error("VERCEL_TOKEN environment variable is required.");
  process.exit(1);
}

const vercelService = new VercelService({
  token: VERCEL_TOKEN,
  teamId: process.env.VERCEL_TEAM_ID,
});

// Initialize tool classes
const tools = {
  projects: new ProjectTools(vercelService),
  deployments: new DeploymentTools(vercelService),
  deploymentWrites: new DeploymentWriteTools(vercelService),
};

// Combine all schemas
const AllToolSchemas = {
  ...ProjectToolSchemas,
  ...DeploymentToolSchemas,
  ...DeploymentWriteToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "vercel-mcp",
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

for (const name of Object.keys(ProjectToolSchemas)) {
  toolRegistry[name] = (args) => (tools.projects[name as keyof ProjectTools] as ToolHandler)(args);
}
for (const name of Object.keys(DeploymentToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.deployments[name as keyof DeploymentTools] as ToolHandler)(args);
}
for (const name of Object.keys(DeploymentWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.deploymentWrites[name as keyof DeploymentWriteTools] as ToolHandler)(args);
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
  console.error("Vercel MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
