import { GoogleAuthService } from "./auth.service";
import { CalendarEvent } from "../common/types";
import { simplifyCalendarEvent } from "../common/utils";

export class CalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  constructor(private auth: GoogleAuthService) {}

  private async request<T>(
    path: string,
    params?: Record<string, string | number>,
    options?: { method?: string; body?: unknown },
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const fetchOptions: RequestInit = {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (options?.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Calendar authentication failed. Your access token may be expired.");
        case 403:
          throw new Error("Calendar access denied. Token may lack the required calendar scope.");
        case 404:
          throw new Error("Calendar resource not found. Check the calendar or event ID.");
        case 429:
          throw new Error("Calendar API rate limit exceeded. Try again later.");
        default:
          throw new Error(
            `Calendar API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    // Handle 204 No Content (e.g., DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async listCalendars(): Promise<unknown> {
    const data = await this.request<{
      items?: Array<Record<string, unknown>>;
    }>("/users/me/calendarList");

    return {
      calendars: (data.items ?? []).map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description ?? null,
        primary: cal.primary ?? false,
        accessRole: cal.accessRole ?? null,
      })),
    };
  }

  async listEvents(
    calendarId: string = "primary",
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10,
  ): Promise<unknown> {
    const params: Record<string, string | number> = {
      maxResults,
      singleEvents: "true",
      orderBy: "startTime",
    };
    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const encodedCalendarId = encodeURIComponent(calendarId);
    const data = await this.request<{
      items?: CalendarEvent[];
      summary?: string;
    }>(`/calendars/${encodedCalendarId}/events`, params);

    return {
      calendar: data.summary ?? calendarId,
      events: (data.items ?? []).map(simplifyCalendarEvent),
    };
  }

  async getEvent(calendarId: string, eventId: string): Promise<unknown> {
    const encodedCalendarId = encodeURIComponent(calendarId);
    const encodedEventId = encodeURIComponent(eventId);
    const event = await this.request<CalendarEvent>(
      `/calendars/${encodedCalendarId}/events/${encodedEventId}`,
    );

    return simplifyCalendarEvent(event);
  }

  async createEvent(
    calendarId: string,
    summary: string,
    start: string,
    end: string,
    description?: string,
    location?: string,
    attendees?: string[],
  ): Promise<unknown> {
    const encodedCalendarId = encodeURIComponent(calendarId);

    const body: Record<string, unknown> = {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
    };
    if (description) body.description = description;
    if (location) body.location = location;
    if (attendees && attendees.length > 0) {
      body.attendees = attendees.map((email) => ({ email }));
    }

    const event = await this.request<CalendarEvent>(
      `/calendars/${encodedCalendarId}/events`,
      undefined,
      { method: "POST", body },
    );

    return simplifyCalendarEvent(event);
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    summary?: string,
    start?: string,
    end?: string,
    description?: string,
    location?: string,
  ): Promise<unknown> {
    const encodedCalendarId = encodeURIComponent(calendarId);
    const encodedEventId = encodeURIComponent(eventId);

    const body: Record<string, unknown> = {};
    if (summary !== undefined) body.summary = summary;
    if (start !== undefined) body.start = { dateTime: start };
    if (end !== undefined) body.end = { dateTime: end };
    if (description !== undefined) body.description = description;
    if (location !== undefined) body.location = location;

    const event = await this.request<CalendarEvent>(
      `/calendars/${encodedCalendarId}/events/${encodedEventId}`,
      undefined,
      { method: "PUT", body },
    );

    return simplifyCalendarEvent(event);
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    const encodedCalendarId = encodeURIComponent(calendarId);
    const encodedEventId = encodeURIComponent(eventId);

    await this.request<void>(
      `/calendars/${encodedCalendarId}/events/${encodedEventId}`,
      undefined,
      { method: "DELETE" },
    );
  }
}
