import { ProductTools } from "./product.tools";
import { StripeService } from "../services/stripe.service";

jest.mock("../services/stripe.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ProductTools", () => {
  let tools: ProductTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new ProductTools(mockService);
  });

  // --- Products ---

  it("should get_product and return MCP formatted content", async () => {
    const mockProduct = { id: "prod_123", name: "Premium Plan" };
    mockService.getProduct.mockResolvedValue(mockProduct as any);

    const result = await tools.get_product({ id: "prod_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProduct, null, 2) }],
    });
    expect(mockService.getProduct).toHaveBeenCalledWith("prod_123");
  });

  it("should list_products and return MCP formatted content", async () => {
    const mockProducts = [{ id: "prod_123", name: "Premium Plan" }];
    mockService.listProducts.mockResolvedValue(mockProducts as any);

    const result = await tools.list_products({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProducts, null, 2) }],
    });
    expect(mockService.listProducts).toHaveBeenCalledWith(10);
  });

  // --- Prices ---

  it("should get_price and return MCP formatted content", async () => {
    const mockPrice = { id: "price_123", unit_amount: 999 };
    mockService.getPrice.mockResolvedValue(mockPrice as any);

    const result = await tools.get_price({ id: "price_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPrice, null, 2) }],
    });
    expect(mockService.getPrice).toHaveBeenCalledWith("price_123");
  });

  it("should list_prices and return MCP formatted content", async () => {
    const mockPrices = [{ id: "price_123", unit_amount: 999 }];
    mockService.listPrices.mockResolvedValue(mockPrices as any);

    const result = await tools.list_prices({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPrices, null, 2) }],
    });
    expect(mockService.listPrices).toHaveBeenCalledWith(5);
  });
});
