import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatTagMetadata } from "../common/utils";

export const TagToolSchemas = {
  list_tags: {
    description: "Lists all tags in the Evernote account. Returns tag name, GUID, and parent GUID.",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
  },
};

export class TagTools {
  constructor(private evernoteService: EvernoteService) {}

  async list_tags() {
    const tags = await this.evernoteService.listTags();
    const formatted = tags.map((tag) =>
      formatTagMetadata(tag as unknown as Record<string, unknown>),
    );
    return formatMcpResponse(formatted);
  }
}
