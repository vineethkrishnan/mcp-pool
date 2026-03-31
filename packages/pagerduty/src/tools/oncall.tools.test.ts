import { OncallTools } from "./oncall.tools";
import { PagerDutyService } from "../services/pagerduty.service";

jest.mock("../services/pagerduty.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("OncallTools", () => {
  let tools: OncallTools;
  let mockService: jest.Mocked<PagerDutyService>;

  beforeEach(() => {
    mockService = new PagerDutyService({
      apiKey: "fake_key",
      baseUrl: "https://api.pagerduty.com",
    }) as jest.Mocked<PagerDutyService>;
    tools = new OncallTools(mockService);
  });

  it("should list_oncalls with no filters", async () => {
    const mockOncalls = [
      {
        user: { summary: "Alice Smith" },
        escalation_policy: { summary: "Default" },
        escalation_level: 1,
      },
    ];
    mockService.listOncalls.mockResolvedValue(mockOncalls);

    const result = await tools.list_oncalls({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockOncalls, null, 2) }],
    });
    expect(mockService.listOncalls).toHaveBeenCalledWith(undefined, 25);
  });

  it("should list_oncalls with schedule_ids filter", async () => {
    mockService.listOncalls.mockResolvedValue([]);

    await tools.list_oncalls({ schedule_ids: ["SCH1", "SCH2"], limit: 10 });

    expect(mockService.listOncalls).toHaveBeenCalledWith(["SCH1", "SCH2"], 10);
  });

  it("should list_oncalls with default limit when not specified", async () => {
    mockService.listOncalls.mockResolvedValue([]);

    await tools.list_oncalls({ limit: 25 });

    expect(mockService.listOncalls).toHaveBeenCalledWith(undefined, 25);
  });

  it("should get_schedule and return MCP formatted content", async () => {
    const mockSchedule = {
      id: "PSCH123",
      name: "Primary On-Call",
      time_zone: "America/New_York",
    };
    mockService.getSchedule.mockResolvedValue(mockSchedule);

    const result = await tools.get_schedule({ schedule_id: "PSCH123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSchedule, null, 2) }],
    });
    expect(mockService.getSchedule).toHaveBeenCalledWith("PSCH123");
  });
});
