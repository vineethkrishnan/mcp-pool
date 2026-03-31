import { UserTools } from "./user.tools";
import { NotionService } from "../services/notion.service";

jest.mock("../services/notion.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("UserTools", () => {
  let tools: UserTools;
  let mockService: jest.Mocked<NotionService>;

  beforeEach(() => {
    mockService = new NotionService({
      apiKey: "secret_fake",
      notionVersion: "2022-06-28",
    }) as jest.Mocked<NotionService>;
    tools = new UserTools(mockService);
  });

  it("should list_users and return MCP formatted content", async () => {
    const mockUsers = {
      results: [
        { id: "user-1", name: "Alice", type: "person" },
        { id: "user-2", name: "Bot", type: "bot" },
      ],
    };
    mockService.listUsers.mockResolvedValue(mockUsers);

    const result = await tools.list_users({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockUsers, null, 2) }],
    });
    expect(mockService.listUsers).toHaveBeenCalledWith(25);
  });

  it("should list_users with custom limit", async () => {
    mockService.listUsers.mockResolvedValue({ results: [] });

    await tools.list_users({ limit: 50 });

    expect(mockService.listUsers).toHaveBeenCalledWith(50);
  });
});
