import { GoogleAuthService } from "./auth.service";
import { CalendarEvent } from "../common/types";
import { simplifyCalendarEvent } from "../common/utils";

export class CalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  constructor(private auth: GoogleAuthService) {}

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Calendar authentication failed. Your access token may be expired.");
        case 403:
          throw new Error("Calendar access denied. Token may lack the calendar.readonly scope.");
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
}
