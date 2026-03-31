import { z } from "zod";
import { HubSpotService } from "../services/hubspot.service";
import { formatMcpResponse } from "../common/utils";

export const DealToolSchemas = {
  list_deals: {
    description:
      "Lists deals from HubSpot CRM with optional property selection and cursor-based pagination. Returns default properties (dealname, amount, dealstage, pipeline, closedate) unless overridden.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of deals to return (max 100)."),
      properties: z
        .array(z.string())
        .optional()
        .describe(
          "Properties to include (e.g., ['dealname', 'amount', 'dealstage']). Uses defaults if not specified.",
        ),
      after: z
        .string()
        .optional()
        .describe(
          "Cursor for pagination. Use the value from paging.next.after in previous response.",
        ),
    }),
  },
  get_deal: {
    description:
      "Retrieves full details for a specific HubSpot deal including pipeline stage, amount, close date, and optional associations (linked contacts, companies).",
    schema: z.object({
      deal_id: z.string().describe("The HubSpot deal ID (numeric string, e.g., '67890')."),
      properties: z
        .array(z.string())
        .optional()
        .describe("Properties to include. Uses defaults if not specified."),
      associations: z
        .array(z.string())
        .optional()
        .describe(
          "Associated object types to include (e.g., ['contacts', 'companies']). Returns linked object IDs.",
        ),
    }),
  },
};

export class DealTools {
  constructor(private hubspotService: HubSpotService) {}

  async list_deals(args: z.infer<typeof DealToolSchemas.list_deals.schema>) {
    const deals = await this.hubspotService.listDeals(args.limit, args.properties, args.after);
    return formatMcpResponse(deals);
  }

  async get_deal(args: z.infer<typeof DealToolSchemas.get_deal.schema>) {
    const deal = await this.hubspotService.getDeal(
      args.deal_id,
      args.properties,
      args.associations,
    );
    return formatMcpResponse(deal);
  }
}
