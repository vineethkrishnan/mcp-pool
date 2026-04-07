import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatTagMetadata } from "../common/utils";

export const TagWriteToolSchemas = {
  create_tag: {
    description:
      "Creates a new tag in Evernote. Optionally set a parent tag for hierarchical tagging.",
    schema: z.object({
      name: z.string().describe("Name of the new tag."),
      parent_guid: z
        .string()
        .optional()
        .describe("GUID of the parent tag for nested tag hierarchies."),
    }),
    annotations: {
      title: "Create Tag",
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class TagWriteTools {
  constructor(private evernoteService: EvernoteService) {}

  async create_tag(args: z.infer<typeof TagWriteToolSchemas.create_tag.schema>) {
    const tag = await this.evernoteService.createTag(args.name, args.parent_guid);
    return formatMcpResponse(
      formatTagMetadata(tag as unknown as Record<string, unknown>),
      "Tag created successfully.",
    );
  }
}
