import { z } from "zod";
import { HubSpotService } from "../services/hubspot.service";
import { formatMcpResponse } from "../common/utils";

export const DealWriteToolSchemas = {
  create_deal: {
    description:
      "Creates a new deal in HubSpot CRM. Requires at least a dealname. Returns the created deal record with its new ID. The 'properties' field is a key-value map of deal properties (e.g., { dealname: 'New Contract', amount: '50000', pipeline: 'default', dealstage: 'appointmentscheduled' }).",
    schema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    annotations: {
      title: "Create Deal",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  update_deal_stage: {
    description:
      "Updates the stage (and optionally the pipeline) of an existing HubSpot deal. Use this to move a deal through its sales pipeline.",
    schema: z.object({
      deal_id: z
        .string()
        .describe("The HubSpot deal ID to update (numeric string, e.g., '67890')."),
      dealstage: z
        .string()
        .describe(
          "The new deal stage identifier (e.g., 'qualifiedtobuy', 'closedwon', 'closedlost').",
        ),
      pipeline: z
        .string()
        .optional()
        .describe(
          "The pipeline identifier. Only needed when moving a deal to a different pipeline.",
        ),
    }),
    annotations: {
      title: "Update Deal Stage",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  create_note: {
    description:
      "Creates a note in HubSpot and optionally associates it with a contact and/or deal. Use for logging call summaries, meeting notes, or follow-up reminders.",
    schema: z.object({
      content: z.string().describe("The note body text (supports HTML)."),
      contact_id: z.string().optional().describe("Contact ID to associate the note with."),
      deal_id: z.string().optional().describe("Deal ID to associate the note with."),
    }),
    annotations: {
      title: "Create Note",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class DealWriteTools {
  constructor(private hubspotService: HubSpotService) {}

  async create_deal(args: z.infer<typeof DealWriteToolSchemas.create_deal.schema>) {
    const deal = await this.hubspotService.createDeal(args.properties);
    return formatMcpResponse(deal, "Deal created successfully.");
  }

  async update_deal_stage(args: z.infer<typeof DealWriteToolSchemas.update_deal_stage.schema>) {
    const deal = await this.hubspotService.updateDealStage(
      args.deal_id,
      args.dealstage,
      args.pipeline,
    );
    return formatMcpResponse(deal, "Deal stage updated successfully.");
  }

  async create_note(args: z.infer<typeof DealWriteToolSchemas.create_note.schema>) {
    const associations: { contactId?: string; dealId?: string } = {};
    if (args.contact_id) associations.contactId = args.contact_id;
    if (args.deal_id) associations.dealId = args.deal_id;

    const note = await this.hubspotService.createNote(
      args.content,
      Object.keys(associations).length > 0 ? associations : undefined,
    );
    return formatMcpResponse(note, "Note created successfully.");
  }
}
