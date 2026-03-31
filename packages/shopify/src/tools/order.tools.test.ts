import { OrderTools } from "./order.tools";
import { ShopifyService } from "../services/shopify.service";

jest.mock("../services/shopify.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("OrderTools", () => {
  let tools: OrderTools;
  let mockService: jest.Mocked<ShopifyService>;

  beforeEach(() => {
    mockService = new ShopifyService({
      storeUrl: "test.myshopify.com",
      accessToken: "fake_token",
    }) as jest.Mocked<ShopifyService>;
    tools = new OrderTools(mockService);
  });

  it("should list_orders with default parameters", async () => {
    const mockOrders = [{ id: 1, name: "#1001" }];
    mockService.listOrders.mockResolvedValue(mockOrders);

    const result = await tools.list_orders({ limit: 50 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockOrders, null, 2) }],
    });
    expect(mockService.listOrders).toHaveBeenCalledWith(undefined, 50);
  });

  it("should list_orders with status filter", async () => {
    const mockOrders = [{ id: 2, name: "#1002" }];
    mockService.listOrders.mockResolvedValue(mockOrders);

    const result = await tools.list_orders({ status: "closed", limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockOrders, null, 2) }],
    });
    expect(mockService.listOrders).toHaveBeenCalledWith("closed", 10);
  });

  it("should get_order by ID", async () => {
    const mockOrder = { id: 12345, name: "#1001", total_price: "99.99" };
    mockService.getOrder.mockResolvedValue(mockOrder);

    const result = await tools.get_order({ order_id: "12345" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockOrder, null, 2) }],
    });
    expect(mockService.getOrder).toHaveBeenCalledWith("12345");
  });
});
