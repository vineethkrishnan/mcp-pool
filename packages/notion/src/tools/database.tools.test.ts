import { DatabaseTools } from "./database.tools";
import { NotionService } from "../services/notion.service";

jest.mock("../services/notion.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("DatabaseTools", () => {
  let tools: DatabaseTools;
  let mockService: jest.Mocked<NotionService>;

  beforeEach(() => {
    mockService = new NotionService({
      apiKey: "secret_fake",
      notionVersion: "2022-06-28",
    }) as jest.Mocked<NotionService>;
    tools = new DatabaseTools(mockService);
  });

  it("should get_database and return MCP formatted content", async () => {
    const mockDb = { id: "db-123", title: [{ plain_text: "Tasks" }] };
    mockService.getDatabase.mockResolvedValue(mockDb);

    const result = await tools.get_database({ database_id: "db-123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockDb, null, 2) }],
    });
    expect(mockService.getDatabase).toHaveBeenCalledWith("db-123");
  });

  it("should query_database with all parameters", async () => {
    const mockResult = { results: [{ id: "entry-1" }] };
    mockService.queryDatabase.mockResolvedValue(mockResult);

    const filter = { property: "Status", select: { equals: "Done" } };
    const sorts = [{ property: "Created", direction: "descending" }];

    const result = await tools.query_database({
      database_id: "db-123",
      filter,
      sorts,
      limit: 50,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResult, null, 2) }],
    });
    expect(mockService.queryDatabase).toHaveBeenCalledWith("db-123", filter, sorts, 50);
  });

  it("should query_database with only required parameters", async () => {
    const mockResult = { results: [] };
    mockService.queryDatabase.mockResolvedValue(mockResult);

    const result = await tools.query_database({
      database_id: "db-456",
      limit: 25,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResult, null, 2) }],
    });
    expect(mockService.queryDatabase).toHaveBeenCalledWith("db-456", undefined, undefined, 25);
  });
});
