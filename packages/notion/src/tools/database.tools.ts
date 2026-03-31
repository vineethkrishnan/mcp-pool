import { z } from "zod";
import { NotionService } from "../services/notion.service";
import { formatMcpResponse } from "../common/utils";

export const DatabaseToolSchemas = {
  get_database: {
    description:
      "Retrieves database metadata including title, description, and property schema (column definitions). Use this to understand the structure of a database before querying it.",
    schema: z.object({
      database_id: z.string().describe("The Notion database ID (UUID or 32-char hex)."),
    }),
  },
  query_database: {
    description:
      "Queries a Notion database with optional filter and sort objects. Returns matching entries with all property values. Use Notion's native filter syntax.",
    schema: z.object({
      database_id: z.string().describe("The Notion database ID (UUID or 32-char hex)."),
      filter: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Notion filter object (see Notion API docs for filter syntax)."),
      sorts: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Array of Notion sort objects."),
      limit: z.number().optional().default(25).describe("Max results (max 100)."),
    }),
  },
};

export class DatabaseTools {
  constructor(private notionService: NotionService) {}

  async get_database(args: z.infer<typeof DatabaseToolSchemas.get_database.schema>) {
    const database = await this.notionService.getDatabase(args.database_id);
    return formatMcpResponse(database);
  }

  async query_database(args: z.infer<typeof DatabaseToolSchemas.query_database.schema>) {
    const result = await this.notionService.queryDatabase(
      args.database_id,
      args.filter,
      args.sorts,
      args.limit,
    );
    return formatMcpResponse(result);
  }
}
