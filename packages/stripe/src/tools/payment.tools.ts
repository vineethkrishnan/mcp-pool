import { z } from 'zod';
import { StripeService } from '../services/stripe.service';

export const PaymentToolSchemas = {
  get_payment_intent: {
    description: "Retrieves details for a specific Stripe PaymentIntent, including status, amount, and any errors. Use this to check the status of a specific transaction.",
    schema: z.object({
      id: z.string().describe("The ID of the PaymentIntent to retrieve (e.g., 'pi_123')."),
    }),
  },
  list_payment_intents: {
    description: "Lists recent PaymentIntents. Useful for seeing the latest transactions or finding a specific one by date.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of transactions to return (max 100)."),
    }),
  },
  get_balance: {
    description: "Retrieves the current Stripe balance, including available and pending funds for different currencies.",
    schema: z.object({}),
  },
};

export class PaymentTools {
  constructor(private stripeService: StripeService) {}

  async get_payment_intent(args: z.infer<typeof PaymentToolSchemas.get_payment_intent.schema>) {
    const data = await this.stripeService.getPaymentIntent(args.id);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  async list_payment_intents(args: z.infer<typeof PaymentToolSchemas.list_payment_intents.schema>) {
    const data = await this.stripeService.listPaymentIntents(args.limit);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  async get_balance() {
    const data = await this.stripeService.getBalance();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
}
