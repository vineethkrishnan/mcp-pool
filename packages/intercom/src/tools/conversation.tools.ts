import { z } from "zod";
import { IntercomService } from "../services/intercom.service";
import {
  formatMcpResponse,
  flattenConversationParts,
  truncateConversationParts,
  stripIntercomMetadata,
} from "../common/utils";
import { McpToolResponse } from "../common/types";

export const ConversationToolSchemas = {
  list_conversations: {
    description:
      "Lists recent conversations from Intercom with state, assignee, and last message preview. Use to browse conversation volume or find conversations by recency.",
    schema: z.object({
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Number of conversations to return (default 20, max 150)."),
    }),
  },
  get_conversation: {
    description:
      "Retrieves full conversation details including all conversation parts (messages, notes, assignments), participants, tags, and custom attributes. Returns a flattened chronological timeline.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID."),
    }),
  },
  search_conversations: {
    description:
      "Searches conversations using Intercom's search endpoint. Searches by message body content. Use this to find conversations about a specific topic, issue, or keyword.",
    schema: z.object({
      query: z.string().describe("Search query to match against conversation message bodies."),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Number of results to return (default 20)."),
    }),
  },
};

export class ConversationTools {
  constructor(private intercomService: IntercomService) {}

  async list_conversations(
    args: z.infer<typeof ConversationToolSchemas.list_conversations.schema>,
  ): Promise<McpToolResponse> {
    const conversations = await this.intercomService.listConversations(args.limit);
    return formatMcpResponse(conversations);
  }

  async get_conversation(
    args: z.infer<typeof ConversationToolSchemas.get_conversation.schema>,
  ): Promise<McpToolResponse> {
    const conversation = await this.intercomService.getConversation(args.conversation_id);
    const record = conversation as Record<string, unknown>;

    // Flatten conversation parts into a readable timeline
    const parts = flattenConversationParts(record);
    const truncatedParts = truncateConversationParts(parts);

    // Strip metadata and build clean response
    const cleaned = stripIntercomMetadata(record) as Record<string, unknown>;
    const result = {
      id: cleaned.id,
      state: cleaned.state,
      assignee: cleaned.assignee,
      tags: cleaned.tags,
      priority: cleaned.priority,
      created_at: cleaned.created_at,
      updated_at: cleaned.updated_at,
      parts: truncatedParts,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  async search_conversations(
    args: z.infer<typeof ConversationToolSchemas.search_conversations.schema>,
  ): Promise<McpToolResponse> {
    const conversations = await this.intercomService.searchConversations(args.query, args.limit);
    return formatMcpResponse(conversations);
  }
}
