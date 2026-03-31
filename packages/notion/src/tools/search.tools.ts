import { z } from "zod";
import { NotionService } from "../services/notion.service";
import { formatMcpResponse } from "../common/utils";

export const SearchToolSchemas = {
  search: {
    description:
      "Searches across all pages and databases in the Notion workspace. Use this to find content by title or text. Only returns content shared with the integration.",
    schema: z.object({
      query: z.string().optional().describe("Search query text."),
      filter: z
        .enum(["page", "database"])
        .optional()
        .describe("Filter results to only pages or only databases."),
      limit: z.number().optional().default(10).describe("Max results (max 100)."),
    }),
  },
};

export class SearchTools {
  constructor(private notionService: NotionService) {}

  async search(args: z.infer<typeof SearchToolSchemas.search.schema>) {
    const filter = args.filter ? { property: "object" as const, value: args.filter } : undefined;
    const result = await this.notionService.search(args.query, filter, args.limit);
    return formatMcpResponse(result);
  }
}
