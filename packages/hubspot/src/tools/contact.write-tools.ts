import { z } from "zod";
import { HubSpotService } from "../services/hubspot.service";
import { formatMcpResponse } from "../common/utils";

export const ContactWriteToolSchemas = {
  create_contact: {
    description:
      "Creates a new contact in HubSpot CRM. Provide at least an email or name. Returns the created contact record with its new ID. The 'properties' field is a key-value map of contact properties (e.g., { email: 'jane@example.com', firstname: 'Jane', lastname: 'Doe', company: 'Acme' }).",
    schema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    annotations: {
      title: "Create Contact",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  update_contact: {
    description:
      "Updates an existing HubSpot contact's properties. Only the provided properties are changed; other properties remain untouched. The 'properties' field is a key-value map of contact properties to update (e.g., { phone: '+1-555-0100', lifecyclestage: 'customer' }).",
    schema: z.object({
      contact_id: z
        .string()
        .describe("The HubSpot contact ID to update (numeric string, e.g., '12345')."),
      properties: z.record(z.string(), z.string()),
    }),
    annotations: {
      title: "Update Contact",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
};

export class ContactWriteTools {
  constructor(private hubspotService: HubSpotService) {}

  async create_contact(args: z.infer<typeof ContactWriteToolSchemas.create_contact.schema>) {
    const contact = await this.hubspotService.createContact(args.properties);
    return formatMcpResponse(contact, "Contact created successfully.");
  }

  async update_contact(args: z.infer<typeof ContactWriteToolSchemas.update_contact.schema>) {
    const contact = await this.hubspotService.updateContact(args.contact_id, args.properties);
    return formatMcpResponse(contact, "Contact updated successfully.");
  }
}
