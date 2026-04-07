import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const CustomerToolSchemas = {
  get_customer: {
    description:
      "Retrieves full details for a specific Stripe customer, including their email, balance, and metadata. Use this when you have a specific customer ID (starting with cus_).",
    schema: z.object({
      id: z.string().describe("The ID of the customer to retrieve (e.g., 'cus_123')."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_customers: {
    description:
      "Lists the most recent Stripe customers. Useful for finding a customer by their name or email if you don't have their ID.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of customers to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class CustomerTools {
  constructor(private stripeService: StripeService) {}

  async get_customer(args: z.infer<typeof CustomerToolSchemas.get_customer.schema>) {
    const customer = await this.stripeService.getCustomer(args.id);
    return formatMcpResponse(customer);
  }

  async list_customers(args: z.infer<typeof CustomerToolSchemas.list_customers.schema>) {
    const customers = await this.stripeService.listCustomers(args.limit);
    return formatMcpResponse(customers);
  }
}
