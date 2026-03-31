import { DealTools } from "./deal.tools";
import { HubSpotService } from "../services/hubspot.service";

jest.mock("../services/hubspot.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("DealTools", () => {
  let tools: DealTools;
  let mockService: jest.Mocked<HubSpotService>;

  beforeEach(() => {
    mockService = new HubSpotService({
      accessToken: "fake_token",
    }) as jest.Mocked<HubSpotService>;
    tools = new DealTools(mockService);
  });

  // ===========================================================================
  // list_deals
  // ===========================================================================

  it("should list_deals with default parameters", async () => {
    const mockData = { results: [{ id: "1", properties: { dealname: "Big Deal" } }] };
    mockService.listDeals.mockResolvedValue(mockData);

    const result = await tools.list_deals({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listDeals).toHaveBeenCalledWith(10, undefined, undefined);
  });

  it("should list_deals with all parameters", async () => {
    const mockData = { results: [] };
    mockService.listDeals.mockResolvedValue(mockData);

    const result = await tools.list_deals({
      limit: 50,
      properties: ["dealname", "amount"],
      after: "next-cursor",
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listDeals).toHaveBeenCalledWith(50, ["dealname", "amount"], "next-cursor");
  });

  // ===========================================================================
  // get_deal
  // ===========================================================================

  it("should get_deal with only required parameters", async () => {
    const mockDeal = { id: "456", properties: { dealname: "Enterprise Deal", amount: "50000" } };
    mockService.getDeal.mockResolvedValue(mockDeal);

    const result = await tools.get_deal({ deal_id: "456" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockDeal, null, 2) }],
    });
    expect(mockService.getDeal).toHaveBeenCalledWith("456", undefined, undefined);
  });

  it("should get_deal with properties and associations", async () => {
    const mockDeal = { id: "789", properties: { dealname: "SMB Deal" } };
    mockService.getDeal.mockResolvedValue(mockDeal);

    const result = await tools.get_deal({
      deal_id: "789",
      properties: ["dealname", "dealstage"],
      associations: ["contacts", "companies"],
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockDeal, null, 2) }],
    });
    expect(mockService.getDeal).toHaveBeenCalledWith(
      "789",
      ["dealname", "dealstage"],
      ["contacts", "companies"],
    );
  });
});
