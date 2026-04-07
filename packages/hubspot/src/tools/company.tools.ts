import { z } from "zod";
import { HubSpotService } from "../services/hubspot.service";
import { formatMcpResponse } from "../common/utils";

export const CompanyToolSchemas = {
  list_companies: {
    description:
      "Lists companies from HubSpot CRM with optional property selection and cursor-based pagination. Returns default properties (name, domain, industry, city, state, phone) unless overridden.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of companies to return (max 100)."),
      properties: z
        .array(z.string())
        .optional()
        .describe(
          "Properties to include (e.g., ['name', 'domain', 'industry']). Uses defaults if not specified.",
        ),
      after: z
        .string()
        .optional()
        .describe(
          "Cursor for pagination. Use the value from paging.next.after in previous response.",
        ),
    }),
    annotations: { readOnlyHint: true },
  },
  get_company: {
    description:
      "Retrieves full details for a specific HubSpot company including domain, industry, and optional associations (linked contacts, deals).",
    schema: z.object({
      company_id: z.string().describe("The HubSpot company ID (numeric string, e.g., '11111')."),
      properties: z
        .array(z.string())
        .optional()
        .describe("Properties to include. Uses defaults if not specified."),
      associations: z
        .array(z.string())
        .optional()
        .describe(
          "Associated object types to include (e.g., ['contacts', 'deals']). Returns linked object IDs.",
        ),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class CompanyTools {
  constructor(private hubspotService: HubSpotService) {}

  async list_companies(args: z.infer<typeof CompanyToolSchemas.list_companies.schema>) {
    const companies = await this.hubspotService.listCompanies(
      args.limit,
      args.properties,
      args.after,
    );
    return formatMcpResponse(companies);
  }

  async get_company(args: z.infer<typeof CompanyToolSchemas.get_company.schema>) {
    const company = await this.hubspotService.getCompany(
      args.company_id,
      args.properties,
      args.associations,
    );
    return formatMcpResponse(company);
  }
}
