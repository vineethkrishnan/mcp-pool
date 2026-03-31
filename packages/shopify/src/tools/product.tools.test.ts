import { ProductTools } from "./product.tools";
import { ShopifyService } from "../services/shopify.service";

jest.mock("../services/shopify.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ProductTools", () => {
  let tools: ProductTools;
  let mockService: jest.Mocked<ShopifyService>;

  beforeEach(() => {
    mockService = new ShopifyService({
      storeUrl: "test.myshopify.com",
      accessToken: "fake_token",
    }) as jest.Mocked<ShopifyService>;
    tools = new ProductTools(mockService);
  });

  it("should list_products with default limit", async () => {
    const mockProducts = [{ id: 1, title: "T-Shirt" }];
    mockService.listProducts.mockResolvedValue(mockProducts);

    const result = await tools.list_products({ limit: 50 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProducts, null, 2) }],
    });
    expect(mockService.listProducts).toHaveBeenCalledWith(50);
  });

  it("should list_products with custom limit", async () => {
    mockService.listProducts.mockResolvedValue([]);

    await tools.list_products({ limit: 10 });

    expect(mockService.listProducts).toHaveBeenCalledWith(10);
  });

  it("should get_product by ID", async () => {
    const mockProduct = { id: 789, title: "Classic T-Shirt", variants: [] };
    mockService.getProduct.mockResolvedValue(mockProduct);

    const result = await tools.get_product({ product_id: "789" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProduct, null, 2) }],
    });
    expect(mockService.getProduct).toHaveBeenCalledWith("789");
  });
});
