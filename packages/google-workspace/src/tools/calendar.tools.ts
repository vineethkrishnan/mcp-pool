import { z } from "zod";
import { CalendarService } from "../services/calendar.service";
import { formatMcpResponse } from "../common/utils";

export const CalendarToolSchemas = {
  list_calendars: {
    description:
      "Lists all calendars the user has access to, including shared and subscribed calendars. Returns calendar ID, name, description, and access role.",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  list_events: {
    description:
      "Lists events within a time range from a calendar. Defaults to primary calendar. Returns title, start/end times, attendees, location, and meeting link. Times must be in RFC3339 format (e.g., '2025-01-01T00:00:00Z').",
    schema: z.object({
      calendar_id: z
        .string()
        .optional()
        .default("primary")
        .describe("Calendar ID (defaults to 'primary')."),
      time_min: z
        .string()
        .optional()
        .describe("Start of time range in RFC3339 format (e.g., '2025-01-01T00:00:00Z')."),
      time_max: z.string().optional().describe("End of time range in RFC3339 format."),
      max_results: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of events to return (default 10, max 250)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_event: {
    description:
      "Retrieves full event details including description, attendees with RSVP status, recurrence rules, and conferencing info.",
    schema: z.object({
      calendar_id: z
        .string()
        .optional()
        .default("primary")
        .describe("Calendar ID (defaults to 'primary')."),
      event_id: z.string().describe("The calendar event ID."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class CalendarTools {
  constructor(private calendarService: CalendarService) {}

  async list_calendars(_args: z.infer<typeof CalendarToolSchemas.list_calendars.schema>) {
    const result = await this.calendarService.listCalendars();
    return formatMcpResponse(result);
  }

  async list_events(args: z.infer<typeof CalendarToolSchemas.list_events.schema>) {
    const result = await this.calendarService.listEvents(
      args.calendar_id,
      args.time_min,
      args.time_max,
      args.max_results,
    );
    return formatMcpResponse(result);
  }

  async get_event(args: z.infer<typeof CalendarToolSchemas.get_event.schema>) {
    const result = await this.calendarService.getEvent(args.calendar_id, args.event_id);
    return formatMcpResponse(result);
  }
}
