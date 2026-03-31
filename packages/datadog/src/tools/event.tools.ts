import { z } from "zod";
import { DatadogService } from "../services/datadog.service";
import { formatMcpResponse } from "../common/utils";

export const EventToolSchemas = {
  list_events: {
    description:
      "Lists Datadog events within a time range. Events include deployments, alerts, comments, and other activity. Use UNIX epoch seconds for start and end.",
    schema: z.object({
      start: z.number().describe("Start time as UNIX epoch seconds."),
      end: z.number().describe("End time as UNIX epoch seconds."),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Maximum number of events to return (default 25, max 100)."),
    }),
  },
  get_event: {
    description:
      "Retrieves a specific Datadog event including title, text, tags, and related resources.",
    schema: z.object({
      event_id: z.number().describe("The Datadog event ID."),
    }),
  },
};

export class EventTools {
  constructor(private datadogService: DatadogService) {}

  async list_events(args: z.infer<typeof EventToolSchemas.list_events.schema>) {
    const events = await this.datadogService.listEvents(args.start, args.end, args.limit);
    return formatMcpResponse(events);
  }

  async get_event(args: z.infer<typeof EventToolSchemas.get_event.schema>) {
    const event = await this.datadogService.getEvent(args.event_id);
    return formatMcpResponse(event);
  }
}
