import { z } from "zod";
import { HubSpotService } from "../services/hubspot.service";
import { formatMcpResponse } from "../common/utils";

export const ContactToolSchemas = {
  list_contacts: {
    description:
      "Lists contacts from HubSpot CRM with optional property selection and cursor-based pagination. Returns default properties (firstname, lastname, email, phone, company) unless overridden.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of contacts to return (max 100)."),
      properties: z
        .array(z.string())
        .optional()
        .describe(
          "Properties to include (e.g., ['firstname', 'lastname', 'email']). Uses defaults if not specified.",
        ),
      after: z
        .string()
        .optional()
        .describe(
          "Cursor for pagination. Use the value from paging.next.after in previous response.",
        ),
    }),
  },
  get_contact: {
    description:
      "Retrieves full details for a specific HubSpot contact including requested properties and optional associations (linked companies, deals, tickets).",
    schema: z.object({
      contact_id: z.string().describe("The HubSpot contact ID (numeric string, e.g., '12345')."),
      properties: z
        .array(z.string())
        .optional()
        .describe("Properties to include. Uses defaults if not specified."),
      associations: z
        .array(z.string())
        .optional()
        .describe(
          "Associated object types to include (e.g., ['companies', 'deals']). Returns linked object IDs.",
        ),
    }),
  },
  search_contacts: {
    description:
      "Searches HubSpot contacts using free-text search across default searchable properties (name, email, phone, company). Use for finding contacts by name, email, or company.",
    schema: z.object({
      query: z.string().describe("Search query (e.g., 'John', 'john@example.com', 'Acme Corp')."),
      properties: z
        .array(z.string())
        .optional()
        .describe("Properties to include in results. Uses defaults if not specified."),
      limit: z.number().optional().default(10).describe("Number of results to return (max 100)."),
    }),
  },
};

export class ContactTools {
  constructor(private hubspotService: HubSpotService) {}

  async list_contacts(args: z.infer<typeof ContactToolSchemas.list_contacts.schema>) {
    const contacts = await this.hubspotService.listContacts(
      args.limit,
      args.properties,
      args.after,
    );
    return formatMcpResponse(contacts);
  }

  async get_contact(args: z.infer<typeof ContactToolSchemas.get_contact.schema>) {
    const contact = await this.hubspotService.getContact(
      args.contact_id,
      args.properties,
      args.associations,
    );
    return formatMcpResponse(contact);
  }

  async search_contacts(args: z.infer<typeof ContactToolSchemas.search_contacts.schema>) {
    const contacts = await this.hubspotService.searchContacts(
      args.query,
      args.properties,
      args.limit,
    );
    return formatMcpResponse(contacts);
  }
}
