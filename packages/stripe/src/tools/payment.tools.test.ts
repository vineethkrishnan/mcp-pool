import { PaymentTools } from "./payment.tools";
import { StripeService } from "../services/stripe.service";

jest.mock("../services/stripe.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("PaymentTools", () => {
  let tools: PaymentTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService("fake_key") as jest.Mocked<StripeService>;
    tools = new PaymentTools(mockService);
  });

  it("should get_payment_intent and return MCP formatted content", async () => {
    const mockPaymentIntent = { id: "pi_123", amount: 5000, currency: "usd" };
    mockService.getPaymentIntent.mockResolvedValue(mockPaymentIntent as any);

    const result = await tools.get_payment_intent({ id: "pi_123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPaymentIntent, null, 2) }],
    });
    expect(mockService.getPaymentIntent).toHaveBeenCalledWith("pi_123");
  });

  it("should list_payment_intents and return MCP formatted content", async () => {
    const mockPaymentIntents = [{ id: "pi_123", amount: 5000 }];
    mockService.listPaymentIntents.mockResolvedValue(mockPaymentIntents as any);

    const result = await tools.list_payment_intents({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockPaymentIntents, null, 2) }],
    });
    expect(mockService.listPaymentIntents).toHaveBeenCalledWith(5);
  });

  it("should get_balance and return MCP formatted content", async () => {
    const mockBalance = { available: [{ amount: 10000, currency: "usd" }] };
    mockService.getBalance.mockResolvedValue(mockBalance as any);

    const result = await tools.get_balance();

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockBalance, null, 2) }],
    });
    expect(mockService.getBalance).toHaveBeenCalled();
  });
});
