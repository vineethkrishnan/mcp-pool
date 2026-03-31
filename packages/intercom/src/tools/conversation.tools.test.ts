import { ConversationTools } from "./conversation.tools";
import { IntercomService } from "../services/intercom.service";

jest.mock("../services/intercom.service");

describe("ConversationTools", () => {
  let tools: ConversationTools;
  let mockService: jest.Mocked<IntercomService>;

  beforeEach(() => {
    mockService = new IntercomService({
      accessToken: "fake_token",
    }) as jest.Mocked<IntercomService>;
    tools = new ConversationTools(mockService);
  });

  // =========================================================================
  // list_conversations
  // =========================================================================

  describe("list_conversations", () => {
    it("should call listConversations and return MCP formatted content", async () => {
      const mockData = { conversations: [{ id: "1", state: "open" }] };
      mockService.listConversations.mockResolvedValue(mockData);

      const result = await tools.list_conversations({ limit: 20 });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.conversations[0].id).toBe("1");
      expect(mockService.listConversations).toHaveBeenCalledWith(20);
    });

    it("should pass custom limit", async () => {
      mockService.listConversations.mockResolvedValue({ conversations: [] });

      await tools.list_conversations({ limit: 50 });

      expect(mockService.listConversations).toHaveBeenCalledWith(50);
    });

    it("should strip internal metadata from response", async () => {
      const mockData = {
        conversations: [{ id: "1", statistics: { time_to_reply: 60 } }],
      };
      mockService.listConversations.mockResolvedValue(mockData);

      const result = await tools.list_conversations({ limit: 20 });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.conversations[0].statistics).toBeUndefined();
    });
  });

  // =========================================================================
  // get_conversation
  // =========================================================================

  describe("get_conversation", () => {
    it("should return conversation with flattened parts", async () => {
      const mockConversation = {
        id: "123",
        state: "open",
        priority: "priority",
        assignee: { type: "admin", id: "a1", name: "Jane" },
        tags: { tags: [{ name: "billing" }] },
        created_at: 1700000000,
        updated_at: 1700001000,
        source: {
          author: { type: "user", id: "u1", name: "Alice" },
          delivered_as: "customer_initiated",
          body: "<p>I need help with billing</p>",
        },
        conversation_parts: {
          conversation_parts: [
            {
              author: { type: "admin", id: "a1", name: "Jane" },
              part_type: "comment",
              body: "<p>Happy to help!</p>",
              created_at: 1700000060,
            },
          ],
        },
        statistics: { time_to_reply: 60 },
      };
      mockService.getConversation.mockResolvedValue(mockConversation);

      const result = await tools.get_conversation({ conversation_id: "123" });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.id).toBe("123");
      expect(parsed.state).toBe("open");
      expect(parsed.parts).toHaveLength(2);
      expect(parsed.parts[0].author).toBe("Alice (user #u1)");
      expect(parsed.parts[0].body).toBe("I need help with billing");
      expect(parsed.parts[1].author).toBe("Jane (admin #a1)");
      expect(parsed.parts[1].body).toBe("Happy to help!");
      // Statistics should be stripped
      expect(parsed.statistics).toBeUndefined();
    });

    it("should call service with correct conversation ID", async () => {
      mockService.getConversation.mockResolvedValue({
        id: "456",
        source: null,
        conversation_parts: { conversation_parts: [] },
      });

      await tools.get_conversation({ conversation_id: "456" });

      expect(mockService.getConversation).toHaveBeenCalledWith("456");
    });
  });

  // =========================================================================
  // search_conversations
  // =========================================================================

  describe("search_conversations", () => {
    it("should call searchConversations and return MCP formatted content", async () => {
      const mockData = { conversations: [{ id: "1", state: "open" }] };
      mockService.searchConversations.mockResolvedValue(mockData);

      const result = await tools.search_conversations({ query: "billing", limit: 20 });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.conversations[0].id).toBe("1");
      expect(mockService.searchConversations).toHaveBeenCalledWith("billing", 20);
    });

    it("should pass all parameters", async () => {
      mockService.searchConversations.mockResolvedValue({ conversations: [] });

      await tools.search_conversations({ query: "refund", limit: 10 });

      expect(mockService.searchConversations).toHaveBeenCalledWith("refund", 10);
    });
  });
});
