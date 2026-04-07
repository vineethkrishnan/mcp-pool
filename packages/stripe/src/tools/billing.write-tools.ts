import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const BillingWriteToolSchemas = {
  update_subscription: {
    description:
      "Updates a Stripe subscription. Can schedule cancellation at period end or change the subscription's price.",
    schema: z.object({
      subscription_id: z
        .string()
        .describe("The ID of the subscription to update (e.g., 'sub_123')."),
      cancel_at_period_end: z
        .boolean()
        .optional()
        .describe("If true, the subscription will be canceled at the end of the current period."),
      price_id: z
        .string()
        .optional()
        .describe("The new price ID to switch the subscription to (e.g., 'price_123')."),
    }),
    annotations: {
      title: "Update Subscription",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  create_invoice: {
    description:
      "Creates a new draft invoice for a customer. The invoice must be finalized before it can be paid.",
    schema: z.object({
      customer_id: z.string().describe("The ID of the customer to invoice (e.g., 'cus_123')."),
      description: z.string().optional().describe("A description for the invoice."),
      auto_advance: z
        .boolean()
        .optional()
        .describe(
          "If true, the invoice will automatically advance to the next status (e.g., from draft to open).",
        ),
    }),
    annotations: {
      title: "Create Invoice",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  finalize_invoice: {
    description:
      "Finalizes a draft invoice, transitioning it to 'open' status so it can be paid. This action cannot be undone.",
    schema: z.object({
      invoice_id: z.string().describe("The ID of the draft invoice to finalize (e.g., 'in_123')."),
      auto_advance: z
        .boolean()
        .optional()
        .describe("If true, the invoice will automatically attempt payment after finalizing."),
    }),
    annotations: {
      title: "Finalize Invoice",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class BillingWriteTools {
  constructor(private stripeService: StripeService) {}

  async update_subscription(
    args: z.infer<typeof BillingWriteToolSchemas.update_subscription.schema>,
  ) {
    const data = await this.stripeService.updateSubscription(
      args.subscription_id,
      args.cancel_at_period_end,
      args.price_id,
    );
    return formatMcpResponse(data, "Subscription updated successfully.");
  }

  async create_invoice(args: z.infer<typeof BillingWriteToolSchemas.create_invoice.schema>) {
    const data = await this.stripeService.createInvoice(
      args.customer_id,
      args.description,
      args.auto_advance,
    );
    return formatMcpResponse(data, "Invoice created successfully.");
  }

  async finalize_invoice(args: z.infer<typeof BillingWriteToolSchemas.finalize_invoice.schema>) {
    const data = await this.stripeService.finalizeInvoice(args.invoice_id, args.auto_advance);
    return formatMcpResponse(data, "Invoice finalized successfully.");
  }
}
