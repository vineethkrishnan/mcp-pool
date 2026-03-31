import { PageTools } from "./page.tools";
import { NotionService } from "../services/notion.service";

jest.mock("../services/notion.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
  flattenBlocks: (blocks: unknown[]) =>
    blocks.map((b) => {
      if (!b || typeof b !== "object") return "";
      const record = b as Record<string, unknown>;
      return record.message ?? `block-${record.id ?? "unknown"}`;
    }),
  truncateBlocks: (blocks: unknown[]) => blocks,
}));

describe("PageTools", () => {
  let tools: PageTools;
  let mockService: jest.Mocked<NotionService>;

  beforeEach(() => {
    mockService = new NotionService({
      apiKey: "secret_fake",
      notionVersion: "2022-06-28",
    }) as jest.Mocked<NotionService>;
    tools = new PageTools(mockService);
  });

  it("should get_page and return MCP formatted content", async () => {
    const mockPage = { id: "page-123", properties: { Name: { title: [] } } };
    mockService.getPage.mockResolvedValue(mockPage);

    const result = await tools.get_page({ page_id: "page-123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPage, null, 2) }],
    });
    expect(mockService.getPage).toHaveBeenCalledWith("page-123");
  });

  it("should get_page_content and return flattened text", async () => {
    const mockBlocks = [
      { id: "b1", type: "paragraph" },
      { id: "b2", type: "heading_1" },
    ];
    mockService.getPageContent.mockResolvedValue(mockBlocks);

    const result = await tools.get_page_content({ page_id: "page-123", max_depth: 3 });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("block-b1");
    expect(result.content[0].text).toContain("block-b2");
    expect(mockService.getPageContent).toHaveBeenCalledWith("page-123", 3);
  });

  it("should get_page_content with custom max_depth", async () => {
    mockService.getPageContent.mockResolvedValue([]);

    await tools.get_page_content({ page_id: "page-123", max_depth: 1 });

    expect(mockService.getPageContent).toHaveBeenCalledWith("page-123", 1);
  });
});
