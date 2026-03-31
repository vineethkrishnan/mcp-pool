import { ContactTools } from "./contact.tools";
import { IntercomService } from "../services/intercom.service";

jest.mock("../services/intercom.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ContactTools", () => {
  let tools: ContactTools;
  let mockService: jest.Mocked<IntercomService>;

  beforeEach(() => {
    mockService = new IntercomService({
      accessToken: "fake_token",
    }) as jest.Mocked<IntercomService>;
    tools = new ContactTools(mockService);
  });

  // =========================================================================
  // list_contacts
  // =========================================================================

  describe("list_contacts", () => {
    it("should call listContacts and return MCP formatted content", async () => {
      const mockData = { data: [{ id: "c1", email: "alice@example.com" }] };
      mockService.listContacts.mockResolvedValue(mockData);

      const result = await tools.list_contacts({ limit: 50 });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data[0].id).toBe("c1");
      expect(mockService.listContacts).toHaveBeenCalledWith(50);
    });

    it("should pass custom limit", async () => {
      mockService.listContacts.mockResolvedValue({ data: [] });

      await tools.list_contacts({ limit: 10 });

      expect(mockService.listContacts).toHaveBeenCalledWith(10);
    });
  });

  // =========================================================================
  // get_contact
  // =========================================================================

  describe("get_contact", () => {
    it("should call getContact and return MCP formatted content", async () => {
      const mockContact = {
        id: "c1",
        email: "alice@example.com",
        name: "Alice",
        role: "user",
      };
      mockService.getContact.mockResolvedValue(mockContact);

      const result = await tools.get_contact({ contact_id: "c1" });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.email).toBe("alice@example.com");
      expect(mockService.getContact).toHaveBeenCalledWith("c1");
    });
  });

  // =========================================================================
  // search_contacts
  // =========================================================================

  describe("search_contacts", () => {
    it("should call searchContacts and return MCP formatted content", async () => {
      const mockData = { data: [{ id: "c1", email: "alice@example.com" }] };
      mockService.searchContacts.mockResolvedValue(mockData);

      const result = await tools.search_contacts({ query: "alice@example.com", limit: 50 });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data[0].email).toBe("alice@example.com");
      expect(mockService.searchContacts).toHaveBeenCalledWith("alice@example.com", 50);
    });

    it("should pass all parameters", async () => {
      mockService.searchContacts.mockResolvedValue({ data: [] });

      await tools.search_contacts({ query: "bob", limit: 5 });

      expect(mockService.searchContacts).toHaveBeenCalledWith("bob", 5);
    });
  });
});
