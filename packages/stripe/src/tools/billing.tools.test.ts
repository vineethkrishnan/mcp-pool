import { BillingTools } from "./billing.tools";
import { StripeService } from "../services/stripe.service";

jest.mock("../services/stripe.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("BillingTools", () => {
  let tools: BillingTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new BillingTools(mockService);
  });

  // --- Subscriptions ---

  it("should get_subscription and return MCP formatted content", async () => {
    const mockSubscription = { id: "sub_123", status: "active" };
    mockService.getSubscription.mockResolvedValue(mockSubscription as any);

    const result = await tools.get_subscription({ id: "sub_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSubscription, null, 2) }],
    });
    expect(mockService.getSubscription).toHaveBeenCalledWith("sub_123");
  });

  it("should list_subscriptions and return MCP formatted content", async () => {
    const mockSubscriptions = [{ id: "sub_123", status: "active" }];
    mockService.listSubscriptions.mockResolvedValue(mockSubscriptions as any);

    const result = await tools.list_subscriptions({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSubscriptions, null, 2) }],
    });
    expect(mockService.listSubscriptions).toHaveBeenCalledWith(5);
  });

  // --- Invoices ---

  it("should get_invoice and return MCP formatted content", async () => {
    const mockInvoice = { id: "in_123", amount_due: 2500 };
    mockService.getInvoice.mockResolvedValue(mockInvoice as any);

    const result = await tools.get_invoice({ id: "in_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockInvoice, null, 2) }],
    });
    expect(mockService.getInvoice).toHaveBeenCalledWith("in_123");
  });

  it("should list_invoices and return MCP formatted content", async () => {
    const mockInvoices = [{ id: "in_123", amount_due: 2500 }];
    mockService.listInvoices.mockResolvedValue(mockInvoices as any);

    const result = await tools.list_invoices({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockInvoices, null, 2) }],
    });
    expect(mockService.listInvoices).toHaveBeenCalledWith(10);
  });

  // --- Coupons ---

  it("should get_coupon and return MCP formatted content", async () => {
    const mockCoupon = { id: "SAVE20", percent_off: 20 };
    mockService.getCoupon.mockResolvedValue(mockCoupon as any);

    const result = await tools.get_coupon({ id: "SAVE20" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCoupon, null, 2) }],
    });
    expect(mockService.getCoupon).toHaveBeenCalledWith("SAVE20");
  });

  it("should list_coupons and return MCP formatted content", async () => {
    const mockCoupons = [{ id: "SAVE20", percent_off: 20 }];
    mockService.listCoupons.mockResolvedValue(mockCoupons as any);

    const result = await tools.list_coupons({ limit: 3 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCoupons, null, 2) }],
    });
    expect(mockService.listCoupons).toHaveBeenCalledWith(3);
  });
});
