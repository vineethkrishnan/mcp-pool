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
import { EvernoteService } from "./services/evernote.service";
import { NotebookTools, NotebookToolSchemas } from "./tools/notebook.tools";
import { NoteTools, NoteToolSchemas } from "./tools/note.tools";
import { TagTools, TagToolSchemas } from "./tools/tag.tools";
import { NoteWriteTools, NoteWriteToolSchemas } from "./tools/note.write-tools";
import { NotebookWriteTools, NotebookWriteToolSchemas } from "./tools/notebook.write-tools";
import { TagWriteTools, TagWriteToolSchemas } from "./tools/tag.write-tools";

// Validate required env var
const token = process.env.EVERNOTE_TOKEN;
if (!token) {
  console.error("Error: EVERNOTE_TOKEN environment variable is required.");
  console.error("Get a developer token at: https://dev.evernote.com/doc/articles/dev_tokens.php");
  process.exit(1);
}

const sandbox = process.env.EVERNOTE_SANDBOX === "true";

const evernoteService = new EvernoteService({ token, sandbox });

// Initialize tool classes
const tools = {
  notebooks: new NotebookTools(evernoteService),
  notes: new NoteTools(evernoteService),
  tags: new TagTools(evernoteService),
  noteWrite: new NoteWriteTools(evernoteService),
  notebookWrite: new NotebookWriteTools(evernoteService),
  tagWrite: new TagWriteTools(evernoteService),
};

// Combine all schemas
const AllToolSchemas = {
  ...NotebookToolSchemas,
  ...NoteToolSchemas,
  ...TagToolSchemas,
  ...NoteWriteToolSchemas,
  ...NotebookWriteToolSchemas,
  ...TagWriteToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server({ name: "evernote-mcp", version }, { capabilities: { tools: {} } });

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
for (const name of Object.keys(NotebookToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.notebooks[name as keyof typeof tools.notebooks] as ToolHandler)(args);
}
for (const name of Object.keys(NoteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.notes[name as keyof typeof tools.notes] as ToolHandler)(args);
}
for (const name of Object.keys(TagToolSchemas)) {
  toolRegistry[name] = (args) => (tools.tags[name as keyof typeof tools.tags] as ToolHandler)(args);
}
for (const name of Object.keys(NoteWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.noteWrite[name as keyof typeof tools.noteWrite] as ToolHandler)(args);
}
for (const name of Object.keys(NotebookWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.notebookWrite[name as keyof typeof tools.notebookWrite] as ToolHandler)(args);
}
for (const name of Object.keys(TagWriteToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.tagWrite[name as keyof typeof tools.tagWrite] as ToolHandler)(args);
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
  console.error(`Evernote MCP Server running on stdio${sandbox ? " (sandbox)" : ""}`);
}

main().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
