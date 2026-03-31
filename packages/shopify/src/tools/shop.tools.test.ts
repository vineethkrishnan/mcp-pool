import { ShopTools } from "./shop.tools";
import { ShopifyService } from "../services/shopify.service";

jest.mock("../services/shopify.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ShopTools", () => {
  let tools: ShopTools;
  let mockService: jest.Mocked<ShopifyService>;

  beforeEach(() => {
    mockService = new ShopifyService({
      storeUrl: "test.myshopify.com",
      accessToken: "fake_token",
    }) as jest.Mocked<ShopifyService>;
    tools = new ShopTools(mockService);
  });

  it("should get_shop_info and return MCP formatted content", async () => {
    const mockShop = {
      name: "My Store",
      email: "owner@mystore.com",
      domain: "my-store.myshopify.com",
      plan_name: "basic",
      currency: "USD",
      timezone: "America/New_York",
    };
    mockService.getShop.mockResolvedValue(mockShop);

    const result = await tools.get_shop_info({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockShop, null, 2) }],
    });
    expect(mockService.getShop).toHaveBeenCalled();
  });
});
