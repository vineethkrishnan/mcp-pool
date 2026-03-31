import { MonitorTools } from "./monitor.tools";
import { DatadogService } from "../services/datadog.service";

jest.mock("../services/datadog.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("MonitorTools", () => {
  let tools: MonitorTools;
  let mockService: jest.Mocked<DatadogService>;

  beforeEach(() => {
    mockService = new DatadogService({
      apiKey: "fake",
      appKey: "fake",
      site: "datadoghq.com",
    }) as jest.Mocked<DatadogService>;
    tools = new MonitorTools(mockService);
  });

  it("should list_monitors with default parameters", async () => {
    const mockMonitors = [
      { id: 1, name: "CPU Alert", status: "OK" },
      { id: 2, name: "Memory Alert", status: "Alert" },
    ];
    mockService.listMonitors.mockResolvedValue(mockMonitors);

    const result = await tools.list_monitors({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMonitors, null, 2) }],
    });
    expect(mockService.listMonitors).toHaveBeenCalledWith(undefined, 25);
  });

  it("should list_monitors with query and custom limit", async () => {
    const mockMonitors = [{ id: 1, name: "CPU Alert" }];
    mockService.listMonitors.mockResolvedValue(mockMonitors);

    const result = await tools.list_monitors({ query: "status:alert", limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMonitors, null, 2) }],
    });
    expect(mockService.listMonitors).toHaveBeenCalledWith("status:alert", 10);
  });

  it("should get_monitor with monitor_id", async () => {
    const mockMonitor = { id: 12345, name: "Disk Monitor", query: "avg:disk{*}" };
    mockService.getMonitor.mockResolvedValue(mockMonitor);

    const result = await tools.get_monitor({ monitor_id: 12345 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMonitor, null, 2) }],
    });
    expect(mockService.getMonitor).toHaveBeenCalledWith(12345);
  });

  it("should search_monitors with query and default limit", async () => {
    const mockResult = {
      monitors: [{ id: 1, name: "CPU" }],
      metadata: { total_count: 1 },
    };
    mockService.searchMonitors.mockResolvedValue(mockResult);

    const result = await tools.search_monitors({ query: "type:metric", limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResult, null, 2) }],
    });
    expect(mockService.searchMonitors).toHaveBeenCalledWith("type:metric", 25);
  });

  it("should search_monitors with custom limit", async () => {
    mockService.searchMonitors.mockResolvedValue({ monitors: [] });

    await tools.search_monitors({ query: "status:alert", limit: 50 });

    expect(mockService.searchMonitors).toHaveBeenCalledWith("status:alert", 50);
  });
});
