import { CustomerTools } from "./customer.tools";
import { ShopifyService } from "../services/shopify.service";

jest.mock("../services/shopify.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("CustomerTools", () => {
  let tools: CustomerTools;
  let mockService: jest.Mocked<ShopifyService>;

  beforeEach(() => {
    mockService = new ShopifyService({
      storeUrl: "test.myshopify.com",
      accessToken: "fake_token",
    }) as jest.Mocked<ShopifyService>;
    tools = new CustomerTools(mockService);
  });

  it("should list_customers with default limit", async () => {
    const mockCustomers = [{ id: 1, email: "john@example.com" }];
    mockService.listCustomers.mockResolvedValue(mockCustomers);

    const result = await tools.list_customers({ limit: 50 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCustomers, null, 2) }],
    });
    expect(mockService.listCustomers).toHaveBeenCalledWith(50);
  });

  it("should list_customers with custom limit", async () => {
    mockService.listCustomers.mockResolvedValue([]);

    await tools.list_customers({ limit: 5 });

    expect(mockService.listCustomers).toHaveBeenCalledWith(5);
  });

  it("should get_customer by ID", async () => {
    const mockCustomer = { id: 456, email: "jane@example.com", orders_count: 3 };
    mockService.getCustomer.mockResolvedValue(mockCustomer);

    const result = await tools.get_customer({ customer_id: "456" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCustomer, null, 2) }],
    });
    expect(mockService.getCustomer).toHaveBeenCalledWith("456");
  });
});
