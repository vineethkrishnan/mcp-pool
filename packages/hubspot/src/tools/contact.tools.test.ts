import { ContactTools } from "./contact.tools";
import { HubSpotService } from "../services/hubspot.service";

jest.mock("../services/hubspot.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ContactTools", () => {
  let tools: ContactTools;
  let mockService: jest.Mocked<HubSpotService>;

  beforeEach(() => {
    mockService = new HubSpotService({
      accessToken: "fake_token",
    }) as jest.Mocked<HubSpotService>;
    tools = new ContactTools(mockService);
  });

  // ===========================================================================
  // list_contacts
  // ===========================================================================

  it("should list_contacts with default parameters", async () => {
    const mockData = { results: [{ id: "1", properties: { firstname: "John" } }] };
    mockService.listContacts.mockResolvedValue(mockData);

    const result = await tools.list_contacts({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listContacts).toHaveBeenCalledWith(10, undefined, undefined);
  });

  it("should list_contacts with all parameters", async () => {
    const mockData = { results: [] };
    mockService.listContacts.mockResolvedValue(mockData);

    const result = await tools.list_contacts({
      limit: 20,
      properties: ["email", "phone"],
      after: "cursor123",
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listContacts).toHaveBeenCalledWith(20, ["email", "phone"], "cursor123");
  });

  // ===========================================================================
  // get_contact
  // ===========================================================================

  it("should get_contact with only required parameters", async () => {
    const mockContact = { id: "123", properties: { firstname: "Jane", email: "jane@example.com" } };
    mockService.getContact.mockResolvedValue(mockContact);

    const result = await tools.get_contact({ contact_id: "123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockContact, null, 2) }],
    });
    expect(mockService.getContact).toHaveBeenCalledWith("123", undefined, undefined);
  });

  it("should get_contact with properties and associations", async () => {
    const mockContact = { id: "456", properties: { firstname: "Bob" } };
    mockService.getContact.mockResolvedValue(mockContact);

    const result = await tools.get_contact({
      contact_id: "456",
      properties: ["email"],
      associations: ["companies", "deals"],
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockContact, null, 2) }],
    });
    expect(mockService.getContact).toHaveBeenCalledWith("456", ["email"], ["companies", "deals"]);
  });

  // ===========================================================================
  // search_contacts
  // ===========================================================================

  it("should search_contacts with query only", async () => {
    const mockData = { results: [{ id: "789", properties: { firstname: "John" } }] };
    mockService.searchContacts.mockResolvedValue(mockData);

    const result = await tools.search_contacts({ query: "John", limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.searchContacts).toHaveBeenCalledWith("John", undefined, 10);
  });

  it("should search_contacts with all parameters", async () => {
    const mockData = { results: [] };
    mockService.searchContacts.mockResolvedValue(mockData);

    const result = await tools.search_contacts({
      query: "jane@example.com",
      properties: ["email", "firstname"],
      limit: 5,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.searchContacts).toHaveBeenCalledWith(
      "jane@example.com",
      ["email", "firstname"],
      5,
    );
  });
});
