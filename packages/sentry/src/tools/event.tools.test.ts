import { EventTools } from "./event.tools";
import { SentryService } from "../services/sentry.service";

jest.mock("../services/sentry.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("EventTools", () => {
  let tools: EventTools;
  let mockService: jest.Mocked<SentryService>;

  beforeEach(() => {
    mockService = new SentryService({
      authToken: "fake_token",
      baseUrl: "https://sentry.io",
    }) as jest.Mocked<SentryService>;
    tools = new EventTools(mockService);
  });

  it("should get_event with all parameters and return MCP formatted content", async () => {
    const mockEvent = {
      eventID: "abc123",
      title: "TypeError",
      entries: [],
    };
    mockService.getEvent.mockResolvedValue(mockEvent);

    const result = await tools.get_event({
      event_id: "abc123",
      project: "my-frontend",
      org: "my-org",
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvent, null, 2) }],
    });
    expect(mockService.getEvent).toHaveBeenCalledWith("abc123", "my-frontend", "my-org");
  });

  it("should get_event with default org", async () => {
    const mockEvent = { eventID: "def456", title: "Error" };
    mockService.getEvent.mockResolvedValue(mockEvent);

    const result = await tools.get_event({
      event_id: "def456",
      project: "my-backend",
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvent, null, 2) }],
    });
    expect(mockService.getEvent).toHaveBeenCalledWith("def456", "my-backend", undefined);
  });

  it("should list_issue_events and return MCP formatted content", async () => {
    const mockEvents = [
      { eventID: "evt1", dateCreated: "2026-03-30T10:00:00Z" },
      { eventID: "evt2", dateCreated: "2026-03-30T11:00:00Z" },
    ];
    mockService.listIssueEvents.mockResolvedValue(mockEvents);

    const result = await tools.list_issue_events({
      issue_id: "12345",
      limit: 10,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvents, null, 2) }],
    });
    expect(mockService.listIssueEvents).toHaveBeenCalledWith("12345", 10);
  });

  it("should list_issue_events with default limit", async () => {
    const mockEvents = [{ eventID: "evt3" }];
    mockService.listIssueEvents.mockResolvedValue(mockEvents);

    const result = await tools.list_issue_events({
      issue_id: "67890",
      limit: 25,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvents, null, 2) }],
    });
    expect(mockService.listIssueEvents).toHaveBeenCalledWith("67890", 25);
  });

  it("should get_latest_event and return MCP formatted content", async () => {
    const mockEvent = {
      eventID: "latest123",
      title: "NullPointerException",
      entries: [{ type: "exception", data: {} }],
    };
    mockService.getLatestEvent.mockResolvedValue(mockEvent);

    const result = await tools.get_latest_event({ issue_id: "12345" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockEvent, null, 2) }],
    });
    expect(mockService.getLatestEvent).toHaveBeenCalledWith("12345");
  });
});
