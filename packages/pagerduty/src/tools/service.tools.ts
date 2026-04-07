import { z } from "zod";
import { PagerDutyService } from "../services/pagerduty.service";
import { formatMcpResponse } from "../common/utils";

export const ServiceToolSchemas = {
  list_services: {
    description:
      "Lists PagerDuty services. Returns service name, status, escalation policy, and alert grouping settings. Use to discover which services are configured and their current operational status.",
    schema: z.object({
      limit: z.number().optional().default(25).describe("Number of services to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_service: {
    description:
      "Retrieves full details for a specific PagerDuty service including status, description, escalation policy, integrations, and alert creation settings. Use when you have a specific service ID.",
    schema: z.object({
      service_id: z.string().describe("The PagerDuty service ID (e.g., 'PSVC123')."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class ServiceTools {
  constructor(private pagerDutyService: PagerDutyService) {}

  async list_services(args: z.infer<typeof ServiceToolSchemas.list_services.schema>) {
    const services = await this.pagerDutyService.listServices(args.limit);
    return formatMcpResponse(services);
  }

  async get_service(args: z.infer<typeof ServiceToolSchemas.get_service.schema>) {
    const service = await this.pagerDutyService.getService(args.service_id);
    return formatMcpResponse(service);
  }
}
