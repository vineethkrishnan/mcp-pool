import { z } from "zod";
import { IntercomService } from "../services/intercom.service";
import { formatMcpResponse } from "../common/utils";
import { McpToolResponse } from "../common/types";

export const ConversationWriteToolSchemas = {
  reply_to_conversation: {
    description:
      "Sends an admin reply to an Intercom conversation. The reply is visible to the customer. Use this to respond to a customer's message.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID to reply to."),
      body: z.string().describe("The HTML or plain-text body of the reply."),
      admin_id: z.string().describe("The ID of the admin sending the reply."),
    }),
    annotations: {
      title: "Reply to conversation",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  close_conversation: {
    description:
      "Closes an Intercom conversation on behalf of an admin. The conversation will be marked as closed and removed from the open queue.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID to close."),
      admin_id: z.string().describe("The ID of the admin closing the conversation."),
    }),
    annotations: {
      title: "Close conversation",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  snooze_conversation: {
    description:
      "Snoozes an Intercom conversation until a specified time. The conversation will reopen automatically when the snooze period expires.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID to snooze."),
      admin_id: z.string().describe("The ID of the admin snoozing the conversation."),
      snoozed_until: z
        .number()
        .describe("Unix timestamp (seconds) when the conversation should reopen."),
    }),
    annotations: {
      title: "Snooze conversation",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  assign_conversation: {
    description:
      "Assigns an Intercom conversation to a specific admin or team. Use this to route conversations to the appropriate handler.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID to assign."),
      admin_id: z.string().describe("The ID of the admin performing the assignment (the actor)."),
      assignee_id: z
        .string()
        .describe("The ID of the admin or team to assign the conversation to."),
      assignee_type: z
        .string()
        .optional()
        .default("admin")
        .describe("Type of the assignee: 'admin' or 'team' (default 'admin')."),
    }),
    annotations: {
      title: "Assign conversation",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  add_note: {
    description:
      "Adds an internal note to an Intercom conversation. Notes are only visible to admins and are not sent to the customer.",
    schema: z.object({
      conversation_id: z.string().describe("The Intercom conversation ID to add a note to."),
      admin_id: z.string().describe("The ID of the admin adding the note."),
      body: z.string().describe("The HTML or plain-text body of the note."),
    }),
    annotations: {
      title: "Add note to conversation",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class ConversationWriteTools {
  constructor(private intercomService: IntercomService) {}

  async reply_to_conversation(
    args: z.infer<typeof ConversationWriteToolSchemas.reply_to_conversation.schema>,
  ): Promise<McpToolResponse> {
    const result = await this.intercomService.replyToConversation(
      args.conversation_id,
      args.body,
      args.admin_id,
    );
    return formatMcpResponse(result, `Reply sent to conversation ${args.conversation_id}.`);
  }

  async close_conversation(
    args: z.infer<typeof ConversationWriteToolSchemas.close_conversation.schema>,
  ): Promise<McpToolResponse> {
    const result = await this.intercomService.closeConversation(
      args.conversation_id,
      args.admin_id,
    );
    return formatMcpResponse(result, `Conversation ${args.conversation_id} closed.`);
  }

  async snooze_conversation(
    args: z.infer<typeof ConversationWriteToolSchemas.snooze_conversation.schema>,
  ): Promise<McpToolResponse> {
    const result = await this.intercomService.snoozeConversation(
      args.conversation_id,
      args.admin_id,
      args.snoozed_until,
    );
    const snoozedDate = new Date(args.snoozed_until * 1000).toISOString();
    return formatMcpResponse(
      result,
      `Conversation ${args.conversation_id} snoozed until ${snoozedDate}.`,
    );
  }

  async assign_conversation(
    args: z.infer<typeof ConversationWriteToolSchemas.assign_conversation.schema>,
  ): Promise<McpToolResponse> {
    const result = await this.intercomService.assignConversation(
      args.conversation_id,
      args.admin_id,
      args.assignee_id,
      args.assignee_type,
    );
    return formatMcpResponse(
      result,
      `Conversation ${args.conversation_id} assigned to ${args.assignee_type} ${args.assignee_id}.`,
    );
  }

  async add_note(
    args: z.infer<typeof ConversationWriteToolSchemas.add_note.schema>,
  ): Promise<McpToolResponse> {
    const result = await this.intercomService.addNote(
      args.conversation_id,
      args.admin_id,
      args.body,
    );
    return formatMcpResponse(result, `Note added to conversation ${args.conversation_id}.`);
  }
}
