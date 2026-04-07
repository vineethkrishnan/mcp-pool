import Stripe from "stripe";

export class StripeService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-02-24-preview" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }

  // --- Customers ---
  async getCustomer(id: string) {
    return await this.stripe.customers.retrieve(id);
  }

  async listCustomers(limit: number = 10) {
    const customers = await this.stripe.customers.list({ limit });
    return customers.data;
  }

  // --- Payments (PaymentIntents) ---
  async getPaymentIntent(id: string) {
    return await this.stripe.paymentIntents.retrieve(id);
  }

  async listPaymentIntents(limit: number = 10) {
    const paymentIntents = await this.stripe.paymentIntents.list({ limit });
    return paymentIntents.data;
  }

  // --- Balance ---
  async getBalance() {
    return await this.stripe.balance.retrieve();
  }

  // --- Billing (Subscriptions, Invoices, Coupons) ---
  async getSubscription(id: string) {
    return await this.stripe.subscriptions.retrieve(id);
  }

  async listSubscriptions(limit: number = 10) {
    const subscriptions = await this.stripe.subscriptions.list({ limit });
    return subscriptions.data;
  }

  async getInvoice(id: string) {
    return await this.stripe.invoices.retrieve(id);
  }

  async listInvoices(limit: number = 10) {
    const invoices = await this.stripe.invoices.list({ limit });
    return invoices.data;
  }

  async getCoupon(id: string) {
    return await this.stripe.coupons.retrieve(id);
  }

  async listCoupons(limit: number = 10) {
    const coupons = await this.stripe.coupons.list({ limit });
    return coupons.data;
  }

  // --- Checkout ---
  async getCheckoutSession(id: string) {
    return await this.stripe.checkout.sessions.retrieve(id);
  }

  async listCheckoutSessions(limit: number = 10) {
    const sessions = await this.stripe.checkout.sessions.list({ limit });
    return sessions.data;
  }

  // --- Reporting (Payouts, Disputes) ---
  async getPayout(id: string) {
    return await this.stripe.payouts.retrieve(id);
  }

  async listPayouts(limit: number = 10) {
    const payouts = await this.stripe.payouts.list({ limit });
    return payouts.data;
  }

  async getDispute(id: string) {
    return await this.stripe.disputes.retrieve(id);
  }

  async listDisputes(limit: number = 10) {
    const disputes = await this.stripe.disputes.list({ limit });
    return disputes.data;
  }

  // --- Products & Prices ---
  async getProduct(id: string) {
    return await this.stripe.products.retrieve(id);
  }

  async listProducts(limit: number = 10) {
    const products = await this.stripe.products.list({ limit });
    return products.data;
  }

  async getPrice(id: string) {
    return await this.stripe.prices.retrieve(id);
  }

  async listPrices(limit: number = 10) {
    const prices = await this.stripe.prices.list({ limit });
    return prices.data;
  }

  // --- Tax ---
  async getTaxRate(id: string) {
    return await this.stripe.taxRates.retrieve(id);
  }

  async listTaxRates(limit: number = 10) {
    const taxRates = await this.stripe.taxRates.list({ limit });
    return taxRates.data;
  }

  // --- Refunds ---
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<unknown> {
    const params: Stripe.RefundCreateParams = { payment_intent: paymentIntentId };
    if (amount) params.amount = amount;
    if (reason) params.reason = reason as Stripe.RefundCreateParams["reason"];
    return this.stripe.refunds.create(params);
  }

  // --- Customer Mutations ---
  async updateCustomerMetadata(
    customerId: string,
    metadata: Record<string, string>,
  ): Promise<unknown> {
    return this.stripe.customers.update(customerId, { metadata });
  }

  // --- Subscription Mutations ---
  async updateSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd?: boolean,
    priceId?: string,
  ): Promise<unknown> {
    const params: Stripe.SubscriptionUpdateParams = {};
    if (cancelAtPeriodEnd !== undefined) params.cancel_at_period_end = cancelAtPeriodEnd;
    if (priceId) params.items = [{ price: priceId }];
    return this.stripe.subscriptions.update(subscriptionId, params);
  }

  // --- Invoice Mutations ---
  async createInvoice(
    customerId: string,
    description?: string,
    autoAdvance?: boolean,
  ): Promise<unknown> {
    const params: Stripe.InvoiceCreateParams = { customer: customerId };
    if (description) params.description = description;
    if (autoAdvance !== undefined) params.auto_advance = autoAdvance;
    return this.stripe.invoices.create(params);
  }

  async finalizeInvoice(invoiceId: string, autoAdvance?: boolean): Promise<unknown> {
    return this.stripe.invoices.finalizeInvoice(
      invoiceId,
      autoAdvance !== undefined ? { auto_advance: autoAdvance } : undefined,
    );
  }
}
