import { z } from "zod";
import { DatadogService } from "../services/datadog.service";
import { formatMcpResponse } from "../common/utils";

export const MonitorToolSchemas = {
  list_monitors: {
    description:
      "Lists Datadog monitors. Optionally filter by query string (e.g., 'type:metric status:alert tag:service:web'). Returns monitor name, status, query, tags, and thresholds.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Filter query using Datadog monitor search syntax (e.g., 'status:alert', 'tag:env:prod').",
        ),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Maximum number of monitors to return (default 25, max 100)."),
    }),
  },
  get_monitor: {
    description:
      "Retrieves full details for a specific Datadog monitor including status, query, thresholds, tags, and notification targets.",
    schema: z.object({
      monitor_id: z.number().describe("The Datadog monitor ID."),
    }),
  },
  search_monitors: {
    description:
      "Searches Datadog monitors using monitor search syntax. Returns matching monitors with metadata. Example queries: 'type:metric status:alert', 'tag:service:web', 'notification:@pagerduty'.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "Datadog monitor search query (e.g., 'type:metric status:alert tag:service:web').",
        ),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Maximum number of results to return (default 25, max 100)."),
    }),
  },
};

export class MonitorTools {
  constructor(private datadogService: DatadogService) {}

  async list_monitors(args: z.infer<typeof MonitorToolSchemas.list_monitors.schema>) {
    const monitors = await this.datadogService.listMonitors(args.query, args.limit);
    return formatMcpResponse(monitors);
  }

  async get_monitor(args: z.infer<typeof MonitorToolSchemas.get_monitor.schema>) {
    const monitor = await this.datadogService.getMonitor(args.monitor_id);
    return formatMcpResponse(monitor);
  }

  async search_monitors(args: z.infer<typeof MonitorToolSchemas.search_monitors.schema>) {
    const result = await this.datadogService.searchMonitors(args.query, args.limit);
    return formatMcpResponse(result);
  }
}
