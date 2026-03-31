import { ServiceTools } from "./service.tools";
import { PagerDutyService } from "../services/pagerduty.service";

jest.mock("../services/pagerduty.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ServiceTools", () => {
  let tools: ServiceTools;
  let mockService: jest.Mocked<PagerDutyService>;

  beforeEach(() => {
    mockService = new PagerDutyService({
      apiKey: "fake_key",
      baseUrl: "https://api.pagerduty.com",
    }) as jest.Mocked<PagerDutyService>;
    tools = new ServiceTools(mockService);
  });

  it("should list_services with default limit", async () => {
    const mockServices = [{ id: "SVC1", name: "API Gateway" }];
    mockService.listServices.mockResolvedValue(mockServices);

    const result = await tools.list_services({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockServices, null, 2) }],
    });
    expect(mockService.listServices).toHaveBeenCalledWith(25);
  });

  it("should list_services with custom limit", async () => {
    mockService.listServices.mockResolvedValue([]);

    await tools.list_services({ limit: 50 });

    expect(mockService.listServices).toHaveBeenCalledWith(50);
  });

  it("should get_service and return MCP formatted content", async () => {
    const mockSvc = {
      id: "PSVC123",
      name: "Payment Service",
      status: "active",
    };
    mockService.getService.mockResolvedValue(mockSvc);

    const result = await tools.get_service({ service_id: "PSVC123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSvc, null, 2) }],
    });
    expect(mockService.getService).toHaveBeenCalledWith("PSVC123");
  });
});
