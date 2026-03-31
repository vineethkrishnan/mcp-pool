import { McpToolResponse } from "./types";

const NOTION_STRIP_KEYS = ["object", "request_id", "developer_survey", "public_url"];

// ===========================================================================
// Rich text flattening
// ===========================================================================

/**
 * Converts Notion's rich text array to a single plain text string.
 * Handles text, mention, and equation types.
 */
export function flattenRichText(richText: unknown[]): string {
  if (!Array.isArray(richText)) return "";

  return richText
    .map((segment) => {
      if (!segment || typeof segment !== "object") return "";
      const record = segment as Record<string, unknown>;

      if (record.plain_text && typeof record.plain_text === "string") {
        return record.plain_text;
      }

      const type = record.type as string | undefined;

      if (type === "text") {
        const text = record.text as Record<string, unknown> | undefined;
        return text?.content ?? "";
      }

      if (type === "mention") {
        const mention = record.mention as Record<string, unknown> | undefined;
        if (!mention) return "@unknown";
        const mentionType = mention.type as string;

        if (mentionType === "user") {
          const user = mention.user as Record<string, unknown> | undefined;
          return `@${user?.name ?? "unknown"}`;
        }
        if (mentionType === "page") {
          return "[page mention]";
        }
        if (mentionType === "database") {
          return "[database mention]";
        }
        if (mentionType === "date") {
          const date = mention.date as Record<string, unknown> | undefined;
          return date?.start ? String(date.start) : "[date]";
        }
        return `@${mentionType}`;
      }

      if (type === "equation") {
        const equation = record.equation as Record<string, unknown> | undefined;
        return equation?.expression ?? "";
      }

      return "";
    })
    .join("");
}

// ===========================================================================
// Block rendering
// ===========================================================================

/**
 * Extracts text content from a block by looking at its type-specific data.
 */
function getBlockText(block: Record<string, unknown>): string {
  const type = block.type as string | undefined;
  if (!type) return "";

  const data = block[type] as Record<string, unknown> | undefined;
  if (!data) return "";

  const richText = data.rich_text as unknown[] | undefined;
  if (richText) return flattenRichText(richText);

  return "";
}

/**
 * Renders a single Notion block to a markdown-like plain text line.
 */
function renderBlock(block: Record<string, unknown>, depth: number): string {
  const type = block.type as string | undefined;
  if (!type) return "";

  const indent = "  ".repeat(depth);
  const text = getBlockText(block);

  switch (type) {
    case "paragraph":
      return `${indent}${text}`;

    case "heading_1":
      return `${indent}# ${text}`;

    case "heading_2":
      return `${indent}## ${text}`;

    case "heading_3":
      return `${indent}### ${text}`;

    case "bulleted_list_item":
      return `${indent}- ${text}`;

    case "numbered_list_item":
      return `${indent}1. ${text}`;

    case "to_do": {
      const data = block[type] as Record<string, unknown> | undefined;
      const isChecked = data?.checked === true;
      return `${indent}${isChecked ? "[x]" : "[ ]"} ${text}`;
    }

    case "toggle":
      return `${indent}> ${text}`;

    case "code": {
      const data = block[type] as Record<string, unknown> | undefined;
      const language = (data?.language as string) ?? "";
      return `${indent}\`\`\`${language}\n${indent}${text}\n${indent}\`\`\``;
    }

    case "quote":
      return `${indent}> ${text}`;

    case "divider":
      return `${indent}---`;

    case "callout": {
      const data = block[type] as Record<string, unknown> | undefined;
      const icon = data?.icon as Record<string, unknown> | undefined;
      const emoji = icon?.type === "emoji" ? (icon.emoji as string) : "";
      return `${indent}${emoji ? emoji + " " : ""}${text}`;
    }

    case "image": {
      const data = block[type] as Record<string, unknown> | undefined;
      const caption = data?.caption as unknown[] | undefined;
      const captionText = caption ? flattenRichText(caption) : "";
      let url = "";
      if (data?.type === "external") {
        const external = data.external as Record<string, unknown> | undefined;
        url = (external?.url as string) ?? "";
      } else if (data?.type === "file") {
        const file = data.file as Record<string, unknown> | undefined;
        url = (file?.url as string) ?? "";
      }
      return `${indent}[Image: ${captionText || url}]`;
    }

    case "bookmark": {
      const data = block[type] as Record<string, unknown> | undefined;
      const url = (data?.url as string) ?? "";
      return `${indent}[Bookmark: ${url}]`;
    }

    case "table_row": {
      const data = block[type] as Record<string, unknown> | undefined;
      const cells = data?.cells as unknown[][] | undefined;
      if (!cells) return `${indent}| |`;
      const cellTexts = cells.map((cell) => flattenRichText(cell));
      return `${indent}| ${cellTexts.join(" | ")} |`;
    }

    case "child_page": {
      const data = block[type] as Record<string, unknown> | undefined;
      const title = (data?.title as string) ?? "";
      return `${indent}[Child page: ${title}]`;
    }

    case "child_database": {
      const data = block[type] as Record<string, unknown> | undefined;
      const title = (data?.title as string) ?? "";
      return `${indent}[Child database: ${title}]`;
    }

    case "embed": {
      const data = block[type] as Record<string, unknown> | undefined;
      const url = (data?.url as string) ?? "";
      return `${indent}[Embed: ${url}]`;
    }

    case "synced_block":
      return `${indent}[Synced block]`;

    case "column_list":
    case "column":
      return "";

    default:
      return text ? `${indent}${text}` : `${indent}[${type} block]`;
  }
}

/**
 * Converts an array of Notion block objects to readable text lines.
 */
export function flattenBlocks(blocks: unknown[]): string[] {
  if (!Array.isArray(blocks)) return [];

  const lines: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const record = block as Record<string, unknown>;
    const depth = (record._depth as number) ?? 0;
    const line = renderBlock(record, depth);
    if (line !== "") {
      lines.push(line);
    }
  }
  return lines;
}

// ===========================================================================
// Metadata stripping
// ===========================================================================

/**
 * Recursively removes specified keys from an object.
 */
export function stripNotionMetadata(obj: unknown, keys: string[] = NOTION_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripNotionMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripNotionMetadata(value, keys);
  }
  return result;
}

// ===========================================================================
// Block truncation
// ===========================================================================

/**
 * Limits block count, appending a truncation marker if exceeded.
 */
export function truncateBlocks(blocks: unknown[], max: number = 100): unknown[] {
  if (!Array.isArray(blocks) || blocks.length <= max) return blocks;

  const truncated = blocks.slice(0, max);
  truncated.push({
    _truncated: true,
    message: `[Truncated: showing ${max} of ${blocks.length} total blocks]`,
  });
  return truncated;
}

// ===========================================================================
// Composed transform
// ===========================================================================

/**
 * Composes all Notion-specific transformations for LLM optimization.
 */
export function transformNotionResponse(data: unknown): unknown {
  return stripNotionMetadata(data);
}

// ===========================================================================
// MCP response formatting
// ===========================================================================

/**
 * Transforms Notion data and wraps it in the MCP tool response format.
 */
export function formatMcpResponse(data: unknown): McpToolResponse {
  const transformed = transformNotionResponse(data);
  return {
    content: [{ type: "text", text: JSON.stringify(transformed, null, 2) }],
  };
}

/**
 * Wraps an error in the MCP tool error response format.
 */
export function formatMcpError(error: unknown): McpToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
