import { z } from "zod";
import { IntercomService } from "../services/intercom.service";
import { formatMcpResponse } from "../common/utils";
import { McpToolResponse } from "../common/types";

export const ContactToolSchemas = {
  list_contacts: {
    description:
      "Lists contacts (users and leads) from Intercom with email, name, role, and last seen time. Use to browse contacts or find recently active users.",
    schema: z.object({
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Number of contacts to return (default 50)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_contact: {
    description:
      "Retrieves full details for a specific contact including email, name, custom attributes, tags, companies, and location data.",
    schema: z.object({
      contact_id: z.string().describe("The Intercom contact ID."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_contacts: {
    description:
      "Searches contacts by email using Intercom's search endpoint. Use this to find a specific user or lead by their email address.",
    schema: z.object({
      query: z.string().describe("Email address or partial email to search for."),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Number of results to return (default 50)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class ContactTools {
  constructor(private intercomService: IntercomService) {}

  async list_contacts(
    args: z.infer<typeof ContactToolSchemas.list_contacts.schema>,
  ): Promise<McpToolResponse> {
    const contacts = await this.intercomService.listContacts(args.limit);
    return formatMcpResponse(contacts);
  }

  async get_contact(
    args: z.infer<typeof ContactToolSchemas.get_contact.schema>,
  ): Promise<McpToolResponse> {
    const contact = await this.intercomService.getContact(args.contact_id);
    return formatMcpResponse(contact);
  }

  async search_contacts(
    args: z.infer<typeof ContactToolSchemas.search_contacts.schema>,
  ): Promise<McpToolResponse> {
    const contacts = await this.intercomService.searchContacts(args.query, args.limit);
    return formatMcpResponse(contacts);
  }
}
