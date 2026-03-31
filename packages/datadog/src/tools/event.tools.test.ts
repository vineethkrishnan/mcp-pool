import { EventTools } from "./event.tools";
import { DatadogService } from "../services/datadog.service";

jest.mock("../services/datadog.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("EventTools", () => {
  let tools: EventTools;
  let mockService: jest.Mocked<DatadogService>;

  beforeEach(() => {
    mockService = new DatadogService({
      apiKey: "fake",
      appKey: "fake",
      site: "datadoghq.com",
    }) as jest.Mocked<DatadogService>;
    tools = new EventTools(mockService);
  });

  it("should list_events with all parameters", async () => {
    const mockEvents = { data: [{ id: "evt-1", attributes: { title: "Deploy" } }] };
    mockService.listEvents.mockResolvedValue(mockEvents);

    const result = await tools.list_events({
      start: 1000,
      end: 2000,
      limit: 10,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvents, null, 2) }],
    });
    expect(mockService.listEvents).toHaveBeenCalledWith(1000, 2000, 10);
  });

  it("should list_events with default limit", async () => {
    const mockEvents = { data: [] };
    mockService.listEvents.mockResolvedValue(mockEvents);

    const result = await tools.list_events({
      start: 1000,
      end: 2000,
      limit: 25,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvents, null, 2) }],
    });
    expect(mockService.listEvents).toHaveBeenCalledWith(1000, 2000, 25);
  });

  it("should get_event with event_id", async () => {
    const mockEvent = {
      data: { id: "evt-123", attributes: { title: "Incident" } },
    };
    mockService.getEvent.mockResolvedValue(mockEvent);

    const result = await tools.get_event({ event_id: 123 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvent, null, 2) }],
    });
    expect(mockService.getEvent).toHaveBeenCalledWith(123);
  });
});
