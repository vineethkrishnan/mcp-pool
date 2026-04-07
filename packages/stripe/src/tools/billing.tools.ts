import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const BillingToolSchemas = {
  get_subscription: {
    description:
      "Retrieves details for a specific Stripe subscription, including current status, plan, and next billing date.",
    schema: z.object({
      id: z.string().describe("The ID of the subscription (e.g., 'sub_123')."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_subscriptions: {
    description: "Lists recent subscriptions. Useful for summarizing active plans.",
    schema: z.object({
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Number of subscriptions to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_invoice: {
    description: "Retrieves a specific invoice, including line items and payment status.",
    schema: z.object({
      id: z.string().describe("The ID of the invoice (e.g., 'in_123')."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_invoices: {
    description: "Lists recent invoices. Useful for checking payment history for a customer.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of invoices to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_coupon: {
    description: "Retrieves details of a specific coupon or discount code.",
    schema: z.object({
      id: z.string().describe("The ID or name of the coupon."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_coupons: {
    description: "Lists active coupons and discounts.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of coupons to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class BillingTools {
  constructor(private stripeService: StripeService) {}

  async get_subscription(args: z.infer<typeof BillingToolSchemas.get_subscription.schema>) {
    const data = await this.stripeService.getSubscription(args.id);
    return formatMcpResponse(data);
  }

  async list_subscriptions(args: z.infer<typeof BillingToolSchemas.list_subscriptions.schema>) {
    const data = await this.stripeService.listSubscriptions(args.limit);
    return formatMcpResponse(data);
  }

  async get_invoice(args: z.infer<typeof BillingToolSchemas.get_invoice.schema>) {
    const data = await this.stripeService.getInvoice(args.id);
    return formatMcpResponse(data);
  }

  async list_invoices(args: z.infer<typeof BillingToolSchemas.list_invoices.schema>) {
    const data = await this.stripeService.listInvoices(args.limit);
    return formatMcpResponse(data);
  }

  async get_coupon(args: z.infer<typeof BillingToolSchemas.get_coupon.schema>) {
    const data = await this.stripeService.getCoupon(args.id);
    return formatMcpResponse(data);
  }

  async list_coupons(args: z.infer<typeof BillingToolSchemas.list_coupons.schema>) {
    const data = await this.stripeService.listCoupons(args.limit);
    return formatMcpResponse(data);
  }
}
