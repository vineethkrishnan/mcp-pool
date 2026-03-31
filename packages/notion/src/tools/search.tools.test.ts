import { SearchTools } from "./search.tools";
import { NotionService } from "../services/notion.service";

jest.mock("../services/notion.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("SearchTools", () => {
  let tools: SearchTools;
  let mockService: jest.Mocked<NotionService>;

  beforeEach(() => {
    mockService = new NotionService({
      apiKey: "secret_fake",
      notionVersion: "2022-06-28",
    }) as jest.Mocked<NotionService>;
    tools = new SearchTools(mockService);
  });

  it("should search with query and return MCP formatted content", async () => {
    const mockResults = { results: [{ id: "page-1", title: "Roadmap" }] };
    mockService.search.mockResolvedValue(mockResults);

    const result = await tools.search({ query: "roadmap", limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResults, null, 2) }],
    });
    expect(mockService.search).toHaveBeenCalledWith("roadmap", undefined, 10);
  });

  it("should search with filter parameter", async () => {
    const mockResults = { results: [] };
    mockService.search.mockResolvedValue(mockResults);

    await tools.search({ query: "tasks", filter: "database", limit: 5 });

    expect(mockService.search).toHaveBeenCalledWith(
      "tasks",
      { property: "object", value: "database" },
      5,
    );
  });

  it("should search without query", async () => {
    const mockResults = { results: [] };
    mockService.search.mockResolvedValue(mockResults);

    await tools.search({ limit: 10 });

    expect(mockService.search).toHaveBeenCalledWith(undefined, undefined, 10);
  });
});
