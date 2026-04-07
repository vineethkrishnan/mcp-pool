import { z } from "zod";
import { NotionService } from "../services/notion.service";
import { formatMcpResponse, flattenBlocks, truncateBlocks } from "../common/utils";

export const PageToolSchemas = {
  get_page: {
    description:
      "Retrieves page properties including title, created time, last edited time, parent, and all property values. Use when you have a specific page ID.",
    schema: z.object({
      page_id: z.string().describe("The Notion page ID (UUID or 32-char hex)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_page_content: {
    description:
      "Retrieves the full content of a page as readable text blocks. Recursively fetches nested blocks (toggles, columns, etc.) up to a configurable depth. Returns flattened plain text optimized for LLM consumption.",
    schema: z.object({
      page_id: z.string().describe("The Notion page ID (UUID or 32-char hex)."),
      max_depth: z
        .number()
        .optional()
        .default(3)
        .describe("Maximum recursion depth for nested blocks (default: 3)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class PageTools {
  constructor(private notionService: NotionService) {}

  async get_page(args: z.infer<typeof PageToolSchemas.get_page.schema>) {
    const page = await this.notionService.getPage(args.page_id);
    return formatMcpResponse(page);
  }

  async get_page_content(args: z.infer<typeof PageToolSchemas.get_page_content.schema>) {
    const blocks = await this.notionService.getPageContent(args.page_id, args.max_depth);
    const truncated = truncateBlocks(blocks);
    const lines = flattenBlocks(truncated);
    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
}
