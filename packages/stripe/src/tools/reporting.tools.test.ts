import { CheckoutTools, ReportingTools, TaxTools } from "./reporting.tools";
import { StripeService } from "../services/stripe.service";

jest.mock("../services/stripe.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("CheckoutTools", () => {
  let tools: CheckoutTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new CheckoutTools(mockService);
  });

  it("should get_checkout_session and return MCP formatted content", async () => {
    const mockSession = { id: "cs_123", payment_status: "paid" };
    mockService.getCheckoutSession.mockResolvedValue(mockSession as any);

    const result = await tools.get_checkout_session({ id: "cs_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSession, null, 2) }],
    });
    expect(mockService.getCheckoutSession).toHaveBeenCalledWith("cs_123");
  });

  it("should list_checkout_sessions and return MCP formatted content", async () => {
    const mockSessions = [{ id: "cs_123", payment_status: "paid" }];
    mockService.listCheckoutSessions.mockResolvedValue(mockSessions as any);

    const result = await tools.list_checkout_sessions({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSessions, null, 2) }],
    });
    expect(mockService.listCheckoutSessions).toHaveBeenCalledWith(5);
  });
});

describe("ReportingTools", () => {
  let tools: ReportingTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new ReportingTools(mockService);
  });

  // --- Payouts ---

  it("should get_payout and return MCP formatted content", async () => {
    const mockPayout = { id: "po_123", amount: 50000 };
    mockService.getPayout.mockResolvedValue(mockPayout as any);

    const result = await tools.get_payout({ id: "po_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPayout, null, 2) }],
    });
    expect(mockService.getPayout).toHaveBeenCalledWith("po_123");
  });

  it("should list_payouts and return MCP formatted content", async () => {
    const mockPayouts = [{ id: "po_123", amount: 50000 }];
    mockService.listPayouts.mockResolvedValue(mockPayouts as any);

    const result = await tools.list_payouts({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPayouts, null, 2) }],
    });
    expect(mockService.listPayouts).toHaveBeenCalledWith(10);
  });

  // --- Disputes ---

  it("should get_dispute and return MCP formatted content", async () => {
    const mockDispute = { id: "dp_123", status: "needs_response" };
    mockService.getDispute.mockResolvedValue(mockDispute as any);

    const result = await tools.get_dispute({ id: "dp_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockDispute, null, 2) }],
    });
    expect(mockService.getDispute).toHaveBeenCalledWith("dp_123");
  });

  it("should list_disputes and return MCP formatted content", async () => {
    const mockDisputes = [{ id: "dp_123", status: "needs_response" }];
    mockService.listDisputes.mockResolvedValue(mockDisputes as any);

    const result = await tools.list_disputes({ limit: 3 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockDisputes, null, 2) }],
    });
    expect(mockService.listDisputes).toHaveBeenCalledWith(3);
  });
});

describe("TaxTools", () => {
  let tools: TaxTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new TaxTools(mockService);
  });

  it("should get_tax_rate and return MCP formatted content", async () => {
    const mockTaxRate = { id: "txr_123", percentage: 8.5 };
    mockService.getTaxRate.mockResolvedValue(mockTaxRate as any);

    const result = await tools.get_tax_rate({ id: "txr_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockTaxRate, null, 2) }],
    });
    expect(mockService.getTaxRate).toHaveBeenCalledWith("txr_123");
  });

  it("should list_tax_rates and return MCP formatted content", async () => {
    const mockTaxRates = [{ id: "txr_123", percentage: 8.5 }];
    mockService.listTaxRates.mockResolvedValue(mockTaxRates as any);

    const result = await tools.list_tax_rates({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockTaxRates, null, 2) }],
    });
    expect(mockService.listTaxRates).toHaveBeenCalledWith(5);
  });
});
