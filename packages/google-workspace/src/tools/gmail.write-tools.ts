import { z } from "zod";
import { GmailService } from "../services/gmail.service";
import { formatMcpResponse } from "../common/utils";

export const GmailWriteToolSchemas = {
  send_email: {
    description:
      "Sends an email via Gmail. The email is sent immediately and cannot be undone. For drafting without sending, use create_draft instead.",
    schema: z.object({
      to: z.string().describe("Recipient email address."),
      subject: z.string().describe("Email subject line."),
      body: z.string().describe("Email body content (plain text)."),
      cc: z.string().optional().describe("CC recipient email address(es), comma-separated."),
      bcc: z.string().optional().describe("BCC recipient email address(es), comma-separated."),
    }),
    annotations: {
      title: "Send Email",
      destructiveHint: true,
      idempotentHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  create_draft: {
    description:
      "Creates a draft email in Gmail without sending it. The draft can be reviewed and sent later from the Gmail interface.",
    schema: z.object({
      to: z.string().describe("Recipient email address."),
      subject: z.string().describe("Email subject line."),
      body: z.string().describe("Email body content (plain text)."),
    }),
    annotations: {
      title: "Create Draft",
      destructiveHint: false,
      idempotentHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class GmailWriteTools {
  constructor(private gmailService: GmailService) {}

  async send_email(args: z.infer<typeof GmailWriteToolSchemas.send_email.schema>) {
    const result = await this.gmailService.sendEmail(
      args.to,
      args.subject,
      args.body,
      args.cc,
      args.bcc,
    );

    return formatMcpResponse(result, "Email sent successfully.");
  }

  async create_draft(args: z.infer<typeof GmailWriteToolSchemas.create_draft.schema>) {
    const result = await this.gmailService.createDraft(args.to, args.subject, args.body);

    return formatMcpResponse(result, "Draft created successfully.");
  }
}
