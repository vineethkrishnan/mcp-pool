import { z } from "zod";
import { PagerDutyService } from "../services/pagerduty.service";
import { formatMcpResponse } from "../common/utils";

export const IncidentToolSchemas = {
  list_incidents: {
    description:
      "Lists PagerDuty incidents. Filter by status (triggered, acknowledged, resolved). Returns incident summary, status, urgency, service, and assignments. Use to check what incidents are currently open or recently resolved.",
    schema: z.object({
      status: z
        .enum(["triggered", "acknowledged", "resolved"])
        .optional()
        .describe(
          "Filter by incident status. One of: triggered, acknowledged, resolved. Omit to return all statuses.",
        ),
      limit: z.number().optional().default(25).describe("Number of incidents to return (max 100)."),
    }),
  },
  get_incident: {
    description:
      "Retrieves full details for a specific PagerDuty incident including title, status, urgency, service, escalation policy, assignments, acknowledgements, and created/resolved timestamps. Use when you have a specific incident ID.",
    schema: z.object({
      incident_id: z.string().describe("The PagerDuty incident ID (e.g., 'PABC123')."),
    }),
  },
};

export class IncidentTools {
  constructor(private pagerDutyService: PagerDutyService) {}

  async list_incidents(args: z.infer<typeof IncidentToolSchemas.list_incidents.schema>) {
    const statuses = args.status ? [args.status] : undefined;
    const incidents = await this.pagerDutyService.listIncidents(statuses, args.limit);
    return formatMcpResponse(incidents);
  }

  async get_incident(args: z.infer<typeof IncidentToolSchemas.get_incident.schema>) {
    const incident = await this.pagerDutyService.getIncident(args.incident_id);
    return formatMcpResponse(incident);
  }
}
