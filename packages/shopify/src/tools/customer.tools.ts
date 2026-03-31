import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const CustomerToolSchemas = {
  list_customers: {
    description:
      "Lists customers from the Shopify store. Returns customer summaries including name, email, order count, and total spent.",
    schema: z.object({
      limit: z.number().optional().default(50).describe("Number of customers to return (max 250)."),
    }),
  },
  get_customer: {
    description:
      "Retrieves full details for a specific Shopify customer including email, order count, total spent, addresses, tags, and note.",
    schema: z.object({
      customer_id: z.string().describe("The Shopify customer ID (numeric, e.g., '456')."),
    }),
  },
};

export class CustomerTools {
  constructor(private shopifyService: ShopifyService) {}

  async list_customers(args: z.infer<typeof CustomerToolSchemas.list_customers.schema>) {
    const customers = await this.shopifyService.listCustomers(args.limit);
    return formatMcpResponse(customers);
  }

  async get_customer(args: z.infer<typeof CustomerToolSchemas.get_customer.schema>) {
    const customer = await this.shopifyService.getCustomer(args.customer_id);
    return formatMcpResponse(customer);
  }
}
