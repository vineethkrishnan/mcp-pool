import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const OrderToolSchemas = {
  list_orders: {
    description:
      "Lists orders from the Shopify store. Supports filtering by status: open, closed, cancelled, or any. Returns order summaries including order number, customer, totals, and fulfillment status.",
    schema: z.object({
      status: z
        .enum(["open", "closed", "cancelled", "any"])
        .optional()
        .describe("Filter by order status. Defaults to open."),
      limit: z.number().optional().default(50).describe("Number of orders to return (max 250)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_order: {
    description:
      "Retrieves full details for a specific Shopify order including line items, shipping address, payment status, fulfillments, discount codes, and customer info.",
    schema: z.object({
      order_id: z.string().describe("The Shopify order ID (numeric, e.g., '12345')."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class OrderTools {
  constructor(private shopifyService: ShopifyService) {}

  async list_orders(args: z.infer<typeof OrderToolSchemas.list_orders.schema>) {
    const orders = await this.shopifyService.listOrders(args.status, args.limit);
    return formatMcpResponse(orders);
  }

  async get_order(args: z.infer<typeof OrderToolSchemas.get_order.schema>) {
    const order = await this.shopifyService.getOrder(args.order_id);
    return formatMcpResponse(order);
  }
}
