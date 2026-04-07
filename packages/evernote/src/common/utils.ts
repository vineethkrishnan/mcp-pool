import { McpToolResponse } from "./types";

// ===========================================================================
// ENML handling
// ===========================================================================

/**
 * Strips ENML tags and converts note content to plain text for LLM consumption.
 */
export function enmlToPlainText(enml: string): string {
  if (!enml) return "";

  // Phase 1: Convert semantic ENML/HTML tags to text markers
  let text = enml
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "")
    .replace(/<en-note[^>]*>/g, "")
    .replace(/<\/en-note>/g, "")
    .replace(/<en-media[^>]*\/>/g, "[attachment]")
    .replace(/<en-todo\s+checked="true"\s*\/>/g, "[x] ")
    .replace(/<en-todo\s+checked="false"\s*\/>/g, "[ ] ")
    .replace(/<en-todo\s*\/>/g, "[ ] ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<h1[^>]*>/gi, "# ")
    .replace(/<h2[^>]*>/gi, "## ")
    .replace(/<h3[^>]*>/gi, "### ")
    .replace(/<\/h[1-3]>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n");

  // Phase 2: Strip all remaining HTML/XML tags (loop to handle nested/malformed tags)
  let previous: string;
  do {
    previous = text;
    text = text.replace(/<[^>]+>/g, "");
  } while (text !== previous);

  // Phase 3: Decode HTML entities (order matters — &amp; must be last
  // to avoid double-unescaping sequences like &amp;lt; → &lt; → <)
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

/**
 * Wraps plain text content in valid ENML for creating/updating notes.
 */
export function plainTextToEnml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const lines = escaped.split("\n").map((line) => `<div>${line || "<br/>"}</div>`);

  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>${lines.join("")}</en-note>`;
}

// ===========================================================================
// Response formatting
// ===========================================================================

/**
 * Formats a timestamp (milliseconds) to ISO string.
 */
function formatTimestamp(ms: number | undefined): string | undefined {
  if (!ms) return undefined;
  return new Date(ms).toISOString();
}

/**
 * Formats note metadata for concise LLM output.
 */
export function formatNoteMetadata(note: Record<string, unknown>): Record<string, unknown> {
  return {
    guid: note.guid,
    title: note.title,
    notebook_guid: note.notebookGuid,
    created: formatTimestamp(note.created as number),
    updated: formatTimestamp(note.updated as number),
    tag_guids: note.tagGuids ?? [],
    content_length: note.contentLength,
  };
}

/**
 * Formats notebook metadata.
 */
export function formatNotebookMetadata(notebook: Record<string, unknown>): Record<string, unknown> {
  return {
    guid: notebook.guid,
    name: notebook.name,
    default_notebook: notebook.defaultNotebook ?? false,
    created: formatTimestamp(notebook.serviceCreated as number),
    updated: formatTimestamp(notebook.serviceUpdated as number),
  };
}

/**
 * Formats tag metadata.
 */
export function formatTagMetadata(tag: Record<string, unknown>): Record<string, unknown> {
  return {
    guid: tag.guid,
    name: tag.name,
    parent_guid: tag.parentGuid ?? null,
  };
}

// ===========================================================================
// MCP response formatting
// ===========================================================================

/**
 * Wraps data in the MCP tool response format.
 */
export function formatMcpResponse(data: unknown, actionMessage?: string): McpToolResponse {
  const json = JSON.stringify(data, null, 2);
  const text = actionMessage ? `${actionMessage}\n\n${json}` : json;
  return {
    content: [{ type: "text", text }],
  };
}
