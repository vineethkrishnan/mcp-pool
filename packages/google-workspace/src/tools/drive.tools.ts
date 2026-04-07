import { z } from "zod";
import { DriveService } from "../services/drive.service";
import { formatMcpResponse } from "../common/utils";

export const DriveToolSchemas = {
  list_files: {
    description:
      "Lists files in Google Drive. Supports Drive search query syntax for filtering (e.g., \"name contains 'report'\", \"mimeType='application/pdf'\"). Returns name, type, owner, modified date, and sharing link.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Drive search query (e.g., \"name contains 'Q4 Report'\", \"mimeType='application/pdf'\").",
        ),
      max_results: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of files to return (default 10, max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_file: {
    description:
      "Retrieves full metadata for a Google Drive file including size, permissions, version history, and parent folders.",
    schema: z.object({
      file_id: z.string().describe("The Google Drive file ID."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_files: {
    description:
      "Searches files in Google Drive using Drive search query syntax (e.g., \"name contains 'Q4 Report'\", \"mimeType='application/pdf'\", \"'user@company.com' in writers\"). Returns matching files with name, type, owner, and modified date.",
    schema: z.object({
      query: z
        .string()
        .describe("Drive search query (required). Supports full Drive search syntax."),
      max_results: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of files to return (default 10, max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class DriveTools {
  constructor(private driveService: DriveService) {}

  async list_files(args: z.infer<typeof DriveToolSchemas.list_files.schema>) {
    const result = await this.driveService.listFiles(args.query, args.max_results);
    return formatMcpResponse(result);
  }

  async get_file(args: z.infer<typeof DriveToolSchemas.get_file.schema>) {
    const result = await this.driveService.getFile(args.file_id);
    return formatMcpResponse(result);
  }

  async search_files(args: z.infer<typeof DriveToolSchemas.search_files.schema>) {
    const result = await this.driveService.searchFiles(args.query, args.max_results);
    return formatMcpResponse(result);
  }
}
