import { MetricTools } from "./metric.tools";
import { DatadogService } from "../services/datadog.service";

jest.mock("../services/datadog.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown, resourceType?: string) => ({
    content: [{ type: "text", text: JSON.stringify({ data, resourceType }, null, 2) }],
  }),
}));

describe("MetricTools", () => {
  let tools: MetricTools;
  let mockService: jest.Mocked<DatadogService>;

  beforeEach(() => {
    mockService = new DatadogService({
      apiKey: "fake",
      appKey: "fake",
      site: "datadoghq.com",
    }) as jest.Mocked<DatadogService>;
    tools = new MetricTools(mockService);
  });

  it("should query_metrics with all parameters", async () => {
    const mockMetrics = {
      status: "ok",
      series: [{ metric: "system.cpu.user", pointlist: [[1000, 50]] }],
    };
    mockService.queryMetrics.mockResolvedValue(mockMetrics);

    const result = await tools.query_metrics({
      query: "avg:system.cpu.user{host:web-01}",
      from: 1000,
      to: 2000,
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ data: mockMetrics, resourceType: "metrics" }, null, 2),
        },
      ],
    });
    expect(mockService.queryMetrics).toHaveBeenCalledWith(
      "avg:system.cpu.user{host:web-01}",
      1000,
      2000,
    );
  });

  it("should pass 'metrics' as resourceType to formatMcpResponse", async () => {
    mockService.queryMetrics.mockResolvedValue({ series: [] });

    const result = await tools.query_metrics({
      query: "avg:cpu{*}",
      from: 0,
      to: 100,
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.resourceType).toBe("metrics");
  });
});
