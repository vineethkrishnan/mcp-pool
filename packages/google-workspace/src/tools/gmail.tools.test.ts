import { GmailTools } from "./gmail.tools";
import { GmailService } from "../services/gmail.service";

jest.mock("../services/gmail.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("GmailTools", () => {
  let tools: GmailTools;
  let mockService: jest.Mocked<GmailService>;

  beforeEach(() => {
    const MockGmailService = GmailService as jest.MockedClass<typeof GmailService>;
    mockService = new MockGmailService({} as never) as jest.Mocked<GmailService>;
    tools = new GmailTools(mockService);
  });

  it("should list_messages with default params", async () => {
    const mockMessages = { messages: [{ id: "1", snippet: "Hello" }] };
    mockService.listMessages.mockResolvedValue(mockMessages);

    const result = await tools.list_messages({ max_results: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMessages, null, 2) }],
    });
    expect(mockService.listMessages).toHaveBeenCalledWith(undefined, 10);
  });

  it("should list_messages with query", async () => {
    const mockMessages = { messages: [] };
    mockService.listMessages.mockResolvedValue(mockMessages);

    await tools.list_messages({ query: "is:unread", max_results: 5 });

    expect(mockService.listMessages).toHaveBeenCalledWith("is:unread", 5);
  });

  it("should get_message with message ID", async () => {
    const mockMessage = { id: "msg-1", body: "Hello" };
    mockService.getMessage.mockResolvedValue(mockMessage);

    const result = await tools.get_message({ message_id: "msg-1" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMessage, null, 2) }],
    });
    expect(mockService.getMessage).toHaveBeenCalledWith("msg-1");
  });

  it("should search_messages with query", async () => {
    const mockMessages = { messages: [{ id: "2" }] };
    mockService.searchMessages.mockResolvedValue(mockMessages);

    const result = await tools.search_messages({ query: "from:boss@company.com", max_results: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMessages, null, 2) }],
    });
    expect(mockService.searchMessages).toHaveBeenCalledWith("from:boss@company.com", 10);
  });
});
