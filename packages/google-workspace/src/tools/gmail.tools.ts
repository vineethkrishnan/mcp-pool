import { z } from "zod";
import { GmailService } from "../services/gmail.service";
import { formatMcpResponse } from "../common/utils";

export const GmailToolSchemas = {
  list_messages: {
    description:
      "Lists recent messages in the user's Gmail mailbox. Returns message ID, subject, from, date, and snippet. Supports optional Gmail search query syntax.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe("Gmail search query (e.g., 'is:unread', 'from:boss@company.com')."),
      max_results: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of messages to return (default 10, max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_message: {
    description:
      "Retrieves a specific Gmail message including decoded body (plain text), headers (From, To, Subject, Date), labels, and snippet. Use when you have a specific message ID.",
    schema: z.object({
      message_id: z.string().describe("The Gmail message ID."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_messages: {
    description:
      "Searches Gmail messages using Gmail search syntax (e.g., 'from:boss@company.com is:unread', 'subject:invoice after:2025/01/01', 'has:attachment filename:pdf'). Returns matching messages with ID, subject, from, date, and snippet.",
    schema: z.object({
      query: z
        .string()
        .describe("Gmail search query (required). Supports full Gmail search syntax."),
      max_results: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of messages to return (default 10, max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class GmailTools {
  constructor(private gmailService: GmailService) {}

  async list_messages(args: z.infer<typeof GmailToolSchemas.list_messages.schema>) {
    const result = await this.gmailService.listMessages(args.query, args.max_results);
    return formatMcpResponse(result);
  }

  async get_message(args: z.infer<typeof GmailToolSchemas.get_message.schema>) {
    const result = await this.gmailService.getMessage(args.message_id);
    return formatMcpResponse(result);
  }

  async search_messages(args: z.infer<typeof GmailToolSchemas.search_messages.schema>) {
    const result = await this.gmailService.searchMessages(args.query, args.max_results);
    return formatMcpResponse(result);
  }
}
