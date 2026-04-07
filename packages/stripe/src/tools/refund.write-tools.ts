import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const RefundWriteToolSchemas = {
  create_refund: {
    description:
      "Creates a refund for a specific PaymentIntent. Can refund the full amount or a partial amount. This is a destructive financial operation.",
    schema: z.object({
      payment_intent_id: z
        .string()
        .describe("The ID of the PaymentIntent to refund (e.g., 'pi_123')."),
      amount: z
        .number()
        .optional()
        .describe(
          "Amount to refund in the smallest currency unit (e.g., cents). If omitted, refunds the full amount.",
        ),
      reason: z
        .string()
        .optional()
        .describe(
          "Reason for the refund. One of: 'duplicate', 'fraudulent', or 'requested_by_customer'.",
        ),
    }),
    annotations: {
      title: "Create Refund",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class RefundWriteTools {
  constructor(private stripeService: StripeService) {}

  async create_refund(args: z.infer<typeof RefundWriteToolSchemas.create_refund.schema>) {
    const data = await this.stripeService.createRefund(
      args.payment_intent_id,
      args.amount,
      args.reason,
    );
    return formatMcpResponse(data, "Refund created successfully.");
  }
}
