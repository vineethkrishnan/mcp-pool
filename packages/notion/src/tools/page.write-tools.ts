import { z } from "zod";
import { NotionService } from "../services/notion.service";
import { formatMcpResponse } from "../common/utils";

export const PageWriteToolSchemas = {
  create_page: {
    description:
      "Creates a new Notion page. Must specify either parent_database_id (to add a row to a database) or parent_page_id (to create a sub-page). Properties should match the parent database schema.",
    schema: z.object({
      parent_database_id: z
        .string()
        .optional()
        .describe("Database ID to create the page in (mutually exclusive with parent_page_id)."),
      parent_page_id: z
        .string()
        .optional()
        .describe(
          "Page ID to create a sub-page under (mutually exclusive with parent_database_id).",
        ),
      properties: z
        .string()
        .describe("JSON string of the page properties object (Notion property format)."),
      children: z
        .string()
        .optional()
        .describe("JSON string of block content array to add as page body."),
    }),
    annotations: {
      title: "Create Page",
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  update_page_properties: {
    description:
      "Updates properties of an existing Notion page. Only the specified properties are changed; omitted properties remain unchanged.",
    schema: z.object({
      page_id: z.string().describe("The Notion page ID (UUID or 32-char hex)."),
      properties: z
        .string()
        .describe("JSON string of the properties to update (Notion property format)."),
    }),
    annotations: {
      title: "Update Page Properties",
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  append_blocks: {
    description:
      "Appends block content to the end of a page or block. Use this to add text, headings, lists, and other content to an existing page.",
    schema: z.object({
      block_id: z
        .string()
        .describe("The page or block ID to append children to (UUID or 32-char hex)."),
      children: z.string().describe("JSON string of block array to append (Notion block format)."),
    }),
    annotations: {
      title: "Append Blocks",
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  archive_page: {
    description:
      "Archives (soft-deletes) a Notion page. The page can be restored from the trash in Notion.",
    schema: z.object({
      page_id: z.string().describe("The Notion page ID to archive (UUID or 32-char hex)."),
    }),
    annotations: {
      title: "Archive Page",
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
};

export class PageWriteTools {
  constructor(private notionService: NotionService) {}

  async create_page(args: z.infer<typeof PageWriteToolSchemas.create_page.schema>) {
    if (!args.parent_database_id && !args.parent_page_id) {
      throw new Error("Either parent_database_id or parent_page_id must be provided.");
    }
    if (args.parent_database_id && args.parent_page_id) {
      throw new Error("Provide only one of parent_database_id or parent_page_id, not both.");
    }

    const parent = args.parent_database_id
      ? { database_id: args.parent_database_id }
      : { page_id: args.parent_page_id! };

    const properties = JSON.parse(args.properties) as Record<string, unknown>;
    const children = args.children ? (JSON.parse(args.children) as unknown[]) : undefined;

    const result = await this.notionService.createPage(parent, properties, children);
    return formatMcpResponse(result, "Page created successfully.");
  }

  async update_page_properties(
    args: z.infer<typeof PageWriteToolSchemas.update_page_properties.schema>,
  ) {
    const properties = JSON.parse(args.properties) as Record<string, unknown>;
    const result = await this.notionService.updatePageProperties(args.page_id, properties);
    return formatMcpResponse(result, "Page properties updated successfully.");
  }

  async append_blocks(args: z.infer<typeof PageWriteToolSchemas.append_blocks.schema>) {
    const children = JSON.parse(args.children) as unknown[];
    const result = await this.notionService.appendBlocks(args.block_id, children);
    return formatMcpResponse(result, "Blocks appended successfully.");
  }

  async archive_page(args: z.infer<typeof PageWriteToolSchemas.archive_page.schema>) {
    const result = await this.notionService.archivePage(args.page_id);
    return formatMcpResponse(result, "Page archived successfully.");
  }
}
