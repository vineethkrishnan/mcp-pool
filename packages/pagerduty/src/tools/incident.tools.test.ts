import { IncidentTools } from "./incident.tools";
import { PagerDutyService } from "../services/pagerduty.service";

jest.mock("../services/pagerduty.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("IncidentTools", () => {
  let tools: IncidentTools;
  let mockService: jest.Mocked<PagerDutyService>;

  beforeEach(() => {
    mockService = new PagerDutyService({
      apiKey: "fake_key",
      baseUrl: "https://api.pagerduty.com",
    }) as jest.Mocked<PagerDutyService>;
    tools = new IncidentTools(mockService);
  });

  it("should list_incidents with no filters", async () => {
    const mockIncidents = [{ id: "P1", summary: "Server down" }];
    mockService.listIncidents.mockResolvedValue(mockIncidents);

    const result = await tools.list_incidents({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIncidents, null, 2) }],
    });
    expect(mockService.listIncidents).toHaveBeenCalledWith(undefined, 25);
  });

  it("should list_incidents with status filter", async () => {
    const mockIncidents = [{ id: "P2", status: "triggered" }];
    mockService.listIncidents.mockResolvedValue(mockIncidents);

    const result = await tools.list_incidents({ status: "triggered", limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIncidents, null, 2) }],
    });
    expect(mockService.listIncidents).toHaveBeenCalledWith(["triggered"], 10);
  });

  it("should list_incidents with acknowledged status", async () => {
    mockService.listIncidents.mockResolvedValue([]);

    await tools.list_incidents({ status: "acknowledged", limit: 25 });

    expect(mockService.listIncidents).toHaveBeenCalledWith(["acknowledged"], 25);
  });

  it("should list_incidents with resolved status", async () => {
    mockService.listIncidents.mockResolvedValue([]);

    await tools.list_incidents({ status: "resolved", limit: 50 });

    expect(mockService.listIncidents).toHaveBeenCalledWith(["resolved"], 50);
  });

  it("should get_incident and return MCP formatted content", async () => {
    const mockIncident = {
      id: "PABC123",
      summary: "Database connection timeout",
      status: "triggered",
      urgency: "high",
    };
    mockService.getIncident.mockResolvedValue(mockIncident);

    const result = await tools.get_incident({ incident_id: "PABC123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIncident, null, 2) }],
    });
    expect(mockService.getIncident).toHaveBeenCalledWith("PABC123");
  });
});
