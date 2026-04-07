import { z } from "zod";
import { CalendarService } from "../services/calendar.service";
import { formatMcpResponse } from "../common/utils";

export const CalendarWriteToolSchemas = {
  create_calendar_event: {
    description:
      "Creates a new event in a Google Calendar. Requires summary, start, and end times. Optionally add a description, location, and attendees.",
    schema: z.object({
      calendar_id: z
        .string()
        .optional()
        .default("primary")
        .describe("Calendar ID (defaults to 'primary')."),
      summary: z.string().describe("Event title/summary."),
      start: z
        .string()
        .describe("Event start time in ISO 8601 datetime format (e.g., '2025-06-15T09:00:00Z')."),
      end: z
        .string()
        .describe("Event end time in ISO 8601 datetime format (e.g., '2025-06-15T10:00:00Z')."),
      description: z.string().optional().describe("Event description or notes."),
      location: z.string().optional().describe("Event location (address or place name)."),
      attendees: z
        .string()
        .optional()
        .describe("Comma-separated list of attendee email addresses."),
    }),
    annotations: {
      title: "Create Calendar Event",
      destructiveHint: false,
      idempotentHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  update_calendar_event: {
    description:
      "Updates an existing Google Calendar event. Only provided fields will be changed. Use get_event first to retrieve the current event details and event ID.",
    schema: z.object({
      calendar_id: z
        .string()
        .optional()
        .default("primary")
        .describe("Calendar ID (defaults to 'primary')."),
      event_id: z.string().describe("The calendar event ID to update."),
      summary: z.string().optional().describe("New event title/summary."),
      start: z.string().optional().describe("New start time in ISO 8601 datetime format."),
      end: z.string().optional().describe("New end time in ISO 8601 datetime format."),
      description: z.string().optional().describe("New event description or notes."),
      location: z.string().optional().describe("New event location."),
    }),
    annotations: {
      title: "Update Calendar Event",
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  delete_calendar_event: {
    description:
      "Permanently deletes an event from a Google Calendar. This action cannot be undone. Use get_event first to confirm the event details before deleting.",
    schema: z.object({
      calendar_id: z
        .string()
        .optional()
        .default("primary")
        .describe("Calendar ID (defaults to 'primary')."),
      event_id: z.string().describe("The calendar event ID to delete."),
    }),
    annotations: {
      title: "Delete Calendar Event",
      destructiveHint: true,
      idempotentHint: true,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class CalendarWriteTools {
  constructor(private calendarService: CalendarService) {}

  async create_calendar_event(
    args: z.infer<typeof CalendarWriteToolSchemas.create_calendar_event.schema>,
  ) {
    const attendeeList = args.attendees
      ? args.attendees.split(",").map((email) => email.trim())
      : undefined;

    const result = await this.calendarService.createEvent(
      args.calendar_id,
      args.summary,
      args.start,
      args.end,
      args.description,
      args.location,
      attendeeList,
    );

    return formatMcpResponse(result, "Calendar event created successfully.");
  }

  async update_calendar_event(
    args: z.infer<typeof CalendarWriteToolSchemas.update_calendar_event.schema>,
  ) {
    const result = await this.calendarService.updateEvent(
      args.calendar_id,
      args.event_id,
      args.summary,
      args.start,
      args.end,
      args.description,
      args.location,
    );

    return formatMcpResponse(result, "Calendar event updated successfully.");
  }

  async delete_calendar_event(
    args: z.infer<typeof CalendarWriteToolSchemas.delete_calendar_event.schema>,
  ) {
    await this.calendarService.deleteEvent(args.calendar_id, args.event_id);

    return formatMcpResponse(
      { calendarId: args.calendar_id, eventId: args.event_id, deleted: true },
      "Calendar event deleted successfully.",
    );
  }
}
