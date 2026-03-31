import { CalendarTools } from "./calendar.tools";
import { CalendarService } from "../services/calendar.service";

jest.mock("../services/calendar.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("CalendarTools", () => {
  let tools: CalendarTools;
  let mockService: jest.Mocked<CalendarService>;

  beforeEach(() => {
    const MockCalendarService = CalendarService as jest.MockedClass<typeof CalendarService>;
    mockService = new MockCalendarService({} as never) as jest.Mocked<CalendarService>;
    tools = new CalendarTools(mockService);
  });

  it("should list_calendars", async () => {
    const mockCalendars = { calendars: [{ id: "primary", summary: "My Calendar" }] };
    mockService.listCalendars.mockResolvedValue(mockCalendars);

    const result = await tools.list_calendars({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCalendars, null, 2) }],
    });
    expect(mockService.listCalendars).toHaveBeenCalled();
  });

  it("should list_events with default params", async () => {
    const mockEvents = { calendar: "My Calendar", events: [] };
    mockService.listEvents.mockResolvedValue(mockEvents);

    await tools.list_events({ calendar_id: "primary", max_results: 10 });

    expect(mockService.listEvents).toHaveBeenCalledWith("primary", undefined, undefined, 10);
  });

  it("should list_events with time range", async () => {
    const mockEvents = { calendar: "My Calendar", events: [] };
    mockService.listEvents.mockResolvedValue(mockEvents);

    await tools.list_events({
      calendar_id: "primary",
      time_min: "2025-01-01T00:00:00Z",
      time_max: "2025-01-31T23:59:59Z",
      max_results: 25,
    });

    expect(mockService.listEvents).toHaveBeenCalledWith(
      "primary",
      "2025-01-01T00:00:00Z",
      "2025-01-31T23:59:59Z",
      25,
    );
  });

  it("should get_event with calendar and event ID", async () => {
    const mockEvent = { summary: "Meeting", start: "2025-01-01T14:00:00Z" };
    mockService.getEvent.mockResolvedValue(mockEvent);

    const result = await tools.get_event({ calendar_id: "primary", event_id: "evt-1" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvent, null, 2) }],
    });
    expect(mockService.getEvent).toHaveBeenCalledWith("primary", "evt-1");
  });
});
