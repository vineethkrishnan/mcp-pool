import { StripeService } from "./stripe.service";

describe("StripeService", () => {
  let service: StripeService;
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = {
      customers: { retrieve: jest.fn(), list: jest.fn() },
      paymentIntents: { retrieve: jest.fn(), list: jest.fn() },
      balance: { retrieve: jest.fn() },
      subscriptions: { retrieve: jest.fn(), list: jest.fn() },
      invoices: { retrieve: jest.fn(), list: jest.fn() },
      coupons: { retrieve: jest.fn(), list: jest.fn() },
      checkout: { sessions: { retrieve: jest.fn(), list: jest.fn() } },
      payouts: { retrieve: jest.fn(), list: jest.fn() },
      disputes: { retrieve: jest.fn(), list: jest.fn() },
      products: { retrieve: jest.fn(), list: jest.fn() },
      prices: { retrieve: jest.fn(), list: jest.fn() },
      taxRates: { retrieve: jest.fn(), list: jest.fn() },
    };
    service = new StripeService("fake_key");
    (service as any).stripe = mockStripe;
  });

  // --- Customers ---

  it("should retrieve a customer", async () => {
    const mockCustomer = { id: "cus_123", email: "test@example.com" };
    mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

    const result = await service.getCustomer("cus_123");

    expect(result).toEqual(mockCustomer);
    expect(mockStripe.customers.retrieve).toHaveBeenCalledWith("cus_123");
  });

  it("should list customers", async () => {
    const mockCustomers = { data: [{ id: "cus_123" }] };
    mockStripe.customers.list.mockResolvedValue(mockCustomers);

    const result = await service.listCustomers(5);

    expect(result).toEqual(mockCustomers.data);
    expect(mockStripe.customers.list).toHaveBeenCalledWith({ limit: 5 });
  });

  // --- Payments ---

  it("should retrieve a payment intent", async () => {
    const mockPaymentIntent = { id: "pi_123", amount: 5000 };
    mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

    const result = await service.getPaymentIntent("pi_123");

    expect(result).toEqual(mockPaymentIntent);
    expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith("pi_123");
  });

  it("should list payment intents", async () => {
    const mockPaymentIntents = { data: [{ id: "pi_123", amount: 5000 }] };
    mockStripe.paymentIntents.list.mockResolvedValue(mockPaymentIntents);

    const result = await service.listPaymentIntents(3);

    expect(result).toEqual(mockPaymentIntents.data);
    expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({ limit: 3 });
  });

  // --- Balance ---

  it("should retrieve balance", async () => {
    const mockBalance = { available: [{ amount: 10000, currency: "usd" }] };
    mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

    const result = await service.getBalance();

    expect(result).toEqual(mockBalance);
    expect(mockStripe.balance.retrieve).toHaveBeenCalled();
  });

  // --- Subscriptions ---

  it("should retrieve a subscription", async () => {
    const mockSubscription = { id: "sub_123", status: "active" };
    mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

    const result = await service.getSubscription("sub_123");

    expect(result).toEqual(mockSubscription);
    expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
  });

  it("should list subscriptions", async () => {
    const mockSubscriptions = { data: [{ id: "sub_123", status: "active" }] };
    mockStripe.subscriptions.list.mockResolvedValue(mockSubscriptions);

    const result = await service.listSubscriptions(7);

    expect(result).toEqual(mockSubscriptions.data);
    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({ limit: 7 });
  });

  // --- Invoices ---

  it("should retrieve an invoice", async () => {
    const mockInvoice = { id: "in_123", amount_due: 2500 };
    mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);

    const result = await service.getInvoice("in_123");

    expect(result).toEqual(mockInvoice);
    expect(mockStripe.invoices.retrieve).toHaveBeenCalledWith("in_123");
  });

  it("should list invoices", async () => {
    const mockInvoices = { data: [{ id: "in_123", amount_due: 2500 }] };
    mockStripe.invoices.list.mockResolvedValue(mockInvoices);

    const result = await service.listInvoices(4);

    expect(result).toEqual(mockInvoices.data);
    expect(mockStripe.invoices.list).toHaveBeenCalledWith({ limit: 4 });
  });

  // --- Coupons ---

  it("should retrieve a coupon", async () => {
    const mockCoupon = { id: "SAVE20", percent_off: 20 };
    mockStripe.coupons.retrieve.mockResolvedValue(mockCoupon);

    const result = await service.getCoupon("SAVE20");

    expect(result).toEqual(mockCoupon);
    expect(mockStripe.coupons.retrieve).toHaveBeenCalledWith("SAVE20");
  });

  it("should list coupons", async () => {
    const mockCoupons = { data: [{ id: "SAVE20", percent_off: 20 }] };
    mockStripe.coupons.list.mockResolvedValue(mockCoupons);

    const result = await service.listCoupons(5);

    expect(result).toEqual(mockCoupons.data);
    expect(mockStripe.coupons.list).toHaveBeenCalledWith({ limit: 5 });
  });

  // --- Checkout Sessions ---

  it("should retrieve a checkout session", async () => {
    const mockSession = { id: "cs_123", payment_status: "paid" };
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);

    const result = await service.getCheckoutSession("cs_123");

    expect(result).toEqual(mockSession);
    expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_123");
  });

  it("should list checkout sessions", async () => {
    const mockSessions = { data: [{ id: "cs_123", payment_status: "paid" }] };
    mockStripe.checkout.sessions.list.mockResolvedValue(mockSessions);

    const result = await service.listCheckoutSessions(6);

    expect(result).toEqual(mockSessions.data);
    expect(mockStripe.checkout.sessions.list).toHaveBeenCalledWith({ limit: 6 });
  });

  // --- Payouts ---

  it("should retrieve a payout", async () => {
    const mockPayout = { id: "po_123", amount: 50000 };
    mockStripe.payouts.retrieve.mockResolvedValue(mockPayout);

    const result = await service.getPayout("po_123");

    expect(result).toEqual(mockPayout);
    expect(mockStripe.payouts.retrieve).toHaveBeenCalledWith("po_123");
  });

  it("should list payouts", async () => {
    const mockPayouts = { data: [{ id: "po_123", amount: 50000 }] };
    mockStripe.payouts.list.mockResolvedValue(mockPayouts);

    const result = await service.listPayouts(8);

    expect(result).toEqual(mockPayouts.data);
    expect(mockStripe.payouts.list).toHaveBeenCalledWith({ limit: 8 });
  });

  // --- Disputes ---

  it("should retrieve a dispute", async () => {
    const mockDispute = { id: "dp_123", status: "needs_response" };
    mockStripe.disputes.retrieve.mockResolvedValue(mockDispute);

    const result = await service.getDispute("dp_123");

    expect(result).toEqual(mockDispute);
    expect(mockStripe.disputes.retrieve).toHaveBeenCalledWith("dp_123");
  });

  it("should list disputes", async () => {
    const mockDisputes = { data: [{ id: "dp_123", status: "needs_response" }] };
    mockStripe.disputes.list.mockResolvedValue(mockDisputes);

    const result = await service.listDisputes(2);

    expect(result).toEqual(mockDisputes.data);
    expect(mockStripe.disputes.list).toHaveBeenCalledWith({ limit: 2 });
  });

  // --- Products ---

  it("should retrieve a product", async () => {
    const mockProduct = { id: "prod_123", name: "Premium Plan" };
    mockStripe.products.retrieve.mockResolvedValue(mockProduct);

    const result = await service.getProduct("prod_123");

    expect(result).toEqual(mockProduct);
    expect(mockStripe.products.retrieve).toHaveBeenCalledWith("prod_123");
  });

  it("should list products", async () => {
    const mockProducts = { data: [{ id: "prod_123", name: "Premium Plan" }] };
    mockStripe.products.list.mockResolvedValue(mockProducts);

    const result = await service.listProducts(10);

    expect(result).toEqual(mockProducts.data);
    expect(mockStripe.products.list).toHaveBeenCalledWith({ limit: 10 });
  });

  // --- Prices ---

  it("should retrieve a price", async () => {
    const mockPrice = { id: "price_123", unit_amount: 999 };
    mockStripe.prices.retrieve.mockResolvedValue(mockPrice);

    const result = await service.getPrice("price_123");

    expect(result).toEqual(mockPrice);
    expect(mockStripe.prices.retrieve).toHaveBeenCalledWith("price_123");
  });

  it("should list prices", async () => {
    const mockPrices = { data: [{ id: "price_123", unit_amount: 999 }] };
    mockStripe.prices.list.mockResolvedValue(mockPrices);

    const result = await service.listPrices(5);

    expect(result).toEqual(mockPrices.data);
    expect(mockStripe.prices.list).toHaveBeenCalledWith({ limit: 5 });
  });

  // --- Tax Rates ---

  it("should retrieve a tax rate", async () => {
    const mockTaxRate = { id: "txr_123", percentage: 8.5 };
    mockStripe.taxRates.retrieve.mockResolvedValue(mockTaxRate);

    const result = await service.getTaxRate("txr_123");

    expect(result).toEqual(mockTaxRate);
    expect(mockStripe.taxRates.retrieve).toHaveBeenCalledWith("txr_123");
  });

  it("should list tax rates", async () => {
    const mockTaxRates = { data: [{ id: "txr_123", percentage: 8.5 }] };
    mockStripe.taxRates.list.mockResolvedValue(mockTaxRates);

    const result = await service.listTaxRates(3);

    expect(result).toEqual(mockTaxRates.data);
    expect(mockStripe.taxRates.list).toHaveBeenCalledWith({ limit: 3 });
  });
});
