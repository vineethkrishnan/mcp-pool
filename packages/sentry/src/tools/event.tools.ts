import { z } from "zod";
import { SentryService } from "../services/sentry.service";
import { formatMcpResponse } from "../common/utils";

export const EventToolSchemas = {
  get_event: {
    description:
      "Retrieves a specific Sentry event including full stack trace, breadcrumbs, tags, and context. Use when you have a specific event ID.",
    schema: z.object({
      event_id: z.string().describe("The event ID."),
      project: z.string().describe("The project slug."),
      org: z.string().optional().describe("Organization slug. Uses SENTRY_ORG if not specified."),
    }),
  },
  list_issue_events: {
    description:
      "Lists recent events (occurrences) for a specific issue. Use this to see how often and when an issue occurs.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID."),
      limit: z.number().optional().default(25).describe("Number of events to return (max 100)."),
    }),
  },
  get_latest_event: {
    description:
      "Retrieves the most recent event for a Sentry issue. This is the go-to tool for 'show me the stack trace' — gives you the latest occurrence with full error details.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID."),
    }),
  },
};

export class EventTools {
  constructor(private sentryService: SentryService) {}

  async get_event(args: z.infer<typeof EventToolSchemas.get_event.schema>) {
    const event = await this.sentryService.getEvent(args.event_id, args.project, args.org);
    return formatMcpResponse(event);
  }

  async list_issue_events(args: z.infer<typeof EventToolSchemas.list_issue_events.schema>) {
    const events = await this.sentryService.listIssueEvents(args.issue_id, args.limit);
    return formatMcpResponse(events);
  }

  async get_latest_event(args: z.infer<typeof EventToolSchemas.get_latest_event.schema>) {
    const event = await this.sentryService.getLatestEvent(args.issue_id);
    return formatMcpResponse(event);
  }
}
