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
import { createAuthProvider, createTokenStore } from "@vineethnkrishnan/oauth-core";
import { GoogleAuthService } from "./services/auth.service";
import { GmailService } from "./services/gmail.service";
import { CalendarService } from "./services/calendar.service";
import { DriveService } from "./services/drive.service";
import { SheetsService } from "./services/sheets.service";
import { GmailTools, GmailToolSchemas } from "./tools/gmail.tools";
import { GmailWriteTools, GmailWriteToolSchemas } from "./tools/gmail.write-tools";
import { CalendarTools, CalendarToolSchemas } from "./tools/calendar.tools";
import { CalendarWriteTools, CalendarWriteToolSchemas } from "./tools/calendar.write-tools";
import { DriveTools, DriveToolSchemas } from "./tools/drive.tools";
import { SheetsTools, SheetsToolSchemas } from "./tools/sheets.tools";

// Route CLI subcommands before starting MCP server
if (process.argv[2] === "auth") {
  const auth = createAuthProvider({
    name: "google-workspace",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
    envVars: {
      staticToken: "GOOGLE_ACCESS_TOKEN",
      clientId: "GOOGLE_CLIENT_ID",
      clientSecret: "GOOGLE_CLIENT_SECRET",
    },
    authUrlParams: { access_type: "offline", prompt: "consent" },
  });
  auth.handleCli(process.argv.slice(3));
} else {
  // Config resolution with priority
  const config: import("./common/types").GoogleWorkspaceConfig = {};

  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const delegatedUser = process.env.GOOGLE_DELEGATED_USER;

  if (accessToken) {
    config.accessToken = accessToken;
  } else if (serviceAccountKey) {
    config.serviceAccountKey = serviceAccountKey;
    if (delegatedUser) config.delegatedUser = delegatedUser;
  } else if (clientId && clientSecret) {
    config.clientId = clientId;
    config.clientSecret = clientSecret;
  } else {
    // Fallback: check for stored OAuth tokens
    const tokenStore = createTokenStore("google-workspace");
    const stored = tokenStore.load();
    if (stored) {
      config.clientId = stored.clientId;
      config.clientSecret = stored.clientSecret;
    } else {
      console.error(
        "Google Workspace authentication required.\n\n" +
          "Options:\n" +
          "  1. Set GOOGLE_ACCESS_TOKEN for a static token\n" +
          "  2. Set GOOGLE_SERVICE_ACCOUNT_KEY for service account auth\n" +
          "  3. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET, then run:\n" +
          "     google-workspace-mcp auth login\n",
      );
      process.exit(1);
    }
  }

  // Initialize auth
  const authService = new GoogleAuthService(config);

  // Initialize services
  const gmailService = new GmailService(authService);
  const calendarService = new CalendarService(authService);
  const driveService = new DriveService(authService);
  const sheetsService = new SheetsService(authService);

  // Initialize tool classes
  const tools = {
    gmail: new GmailTools(gmailService),
    gmailWrite: new GmailWriteTools(gmailService),
    calendar: new CalendarTools(calendarService),
    calendarWrite: new CalendarWriteTools(calendarService),
    drive: new DriveTools(driveService),
    sheets: new SheetsTools(sheetsService),
  };

  // Combine all schemas
  const AllToolSchemas = {
    ...GmailToolSchemas,
    ...GmailWriteToolSchemas,
    ...CalendarToolSchemas,
    ...CalendarWriteToolSchemas,
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

  for (const name of Object.keys(GmailToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.gmail[name as keyof typeof tools.gmail] as ToolHandler)(args);
  }
  for (const name of Object.keys(GmailWriteToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.gmailWrite[name as keyof typeof tools.gmailWrite] as ToolHandler)(args);
  }
  for (const name of Object.keys(CalendarToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.calendar[name as keyof typeof tools.calendar] as ToolHandler)(args);
  }
  for (const name of Object.keys(CalendarWriteToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.calendarWrite[name as keyof typeof tools.calendarWrite] as ToolHandler)(args);
  }
  for (const name of Object.keys(DriveToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.drive[name as keyof typeof tools.drive] as ToolHandler)(args);
  }
  for (const name of Object.keys(SheetsToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.sheets[name as keyof typeof tools.sheets] as ToolHandler)(args);
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

  main().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
