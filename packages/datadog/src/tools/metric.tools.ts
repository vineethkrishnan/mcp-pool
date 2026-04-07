import { z } from "zod";
import { DatadogService } from "../services/datadog.service";
import { formatMcpResponse } from "../common/utils";

export const MetricToolSchemas = {
  query_metrics: {
    description:
      "Queries timeseries metric data from Datadog using the metric query syntax. Returns data points and summary statistics. Example queries: 'avg:system.cpu.user{host:web-01}', 'sum:trace.servlet.request.hits{service:web-app}.as_count()'.",
    schema: z.object({
      query: z
        .string()
        .describe("Datadog metric query string (e.g., 'avg:system.cpu.user{host:web-01}')."),
      from: z.number().describe("Start time as UNIX epoch seconds."),
      to: z.number().describe("End time as UNIX epoch seconds."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class MetricTools {
  constructor(private datadogService: DatadogService) {}

  async query_metrics(args: z.infer<typeof MetricToolSchemas.query_metrics.schema>) {
    const metrics = await this.datadogService.queryMetrics(args.query, args.from, args.to);
    return formatMcpResponse(metrics, "metrics");
  }
}
