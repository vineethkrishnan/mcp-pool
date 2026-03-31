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
import { GoogleAuthService } from "./services/auth.service";
import { GmailService } from "./services/gmail.service";
import { CalendarService } from "./services/calendar.service";
import { DriveService } from "./services/drive.service";
import { SheetsService } from "./services/sheets.service";
import { GmailTools, GmailToolSchemas } from "./tools/gmail.tools";
import { CalendarTools, CalendarToolSchemas } from "./tools/calendar.tools";
import { DriveTools, DriveToolSchemas } from "./tools/drive.tools";
import { SheetsTools, SheetsToolSchemas } from "./tools/sheets.tools";

// Validate required config
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;

if (!GOOGLE_ACCESS_TOKEN) {
  console.error(
    "GOOGLE_ACCESS_TOKEN environment variable is required. " +
      "Get a token from https://developers.google.com/oauthplayground/",
  );
  process.exit(1);
}

// Initialize auth
const authService = new GoogleAuthService({
  accessToken: GOOGLE_ACCESS_TOKEN,
});

// Initialize services
const gmailService = new GmailService(authService);
const calendarService = new CalendarService(authService);
const driveService = new DriveService(authService);
const sheetsService = new SheetsService(authService);

// Initialize tool classes
const tools = {
  gmail: new GmailTools(gmailService),
  calendar: new CalendarTools(calendarService),
  drive: new DriveTools(driveService),
  sheets: new SheetsTools(sheetsService),
};

// Combine all schemas
const AllToolSchemas = {
  ...GmailToolSchemas,
  ...CalendarToolSchemas,
  ...DriveToolSchemas,
  ...SheetsToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "google-workspace-mcp",
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

for (const name of Object.keys(GmailToolSchemas)) {
  toolRegistry[name] = (args) => (tools.gmail[name as keyof GmailTools] as ToolHandler)(args);
}
for (const name of Object.keys(CalendarToolSchemas)) {
  toolRegistry[name] = (args) => (tools.calendar[name as keyof CalendarTools] as ToolHandler)(args);
}
for (const name of Object.keys(DriveToolSchemas)) {
  toolRegistry[name] = (args) => (tools.drive[name as keyof DriveTools] as ToolHandler)(args);
}
for (const name of Object.keys(SheetsToolSchemas)) {
  toolRegistry[name] = (args) => (tools.sheets[name as keyof SheetsTools] as ToolHandler)(args);
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
  console.error("Google Workspace MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
