import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const OrderWriteToolSchemas = {
  update_order_tags: {
    description:
      "Updates the tags on an existing Shopify order. Replaces the entire tags field. Returns the updated order.",
    schema: z.object({
      order_id: z.string().describe("The Shopify order ID (numeric, e.g., '12345')."),
      tags: z.string().describe("Comma-separated list of tags to set on the order."),
    }),
    annotations: {
      title: "Update Order Tags",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  cancel_order: {
    description:
      "Cancels an open Shopify order. This action cannot be undone. Optionally provide a cancellation reason.",
    schema: z.object({
      order_id: z.string().describe("The Shopify order ID (numeric, e.g., '12345')."),
      reason: z
        .string()
        .optional()
        .describe(
          "Reason for cancellation: 'customer', 'fraud', 'inventory', 'declined', or 'other'.",
        ),
    }),
    annotations: {
      title: "Cancel Order",
      idempotentHint: false,
      destructiveHint: true,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  update_inventory: {
    description:
      "Sets the available inventory quantity for a specific inventory item at a location. Uses Shopify's inventory_levels/set endpoint.",
    schema: z.object({
      inventory_item_id: z.string().describe("The inventory item ID."),
      location_id: z.string().describe("The location ID where inventory is stored."),
      available: z.number().describe("The new available quantity to set."),
    }),
    annotations: {
      title: "Update Inventory",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class OrderWriteTools {
  constructor(private shopifyService: ShopifyService) {}

  async update_order_tags(args: z.infer<typeof OrderWriteToolSchemas.update_order_tags.schema>) {
    const order = await this.shopifyService.updateOrderTags(args.order_id, args.tags);
    return formatMcpResponse(order, `Order ${args.order_id} tags updated successfully.`);
  }

  async cancel_order(args: z.infer<typeof OrderWriteToolSchemas.cancel_order.schema>) {
    const order = await this.shopifyService.cancelOrder(args.order_id, args.reason);
    return formatMcpResponse(order, `Order ${args.order_id} cancelled successfully.`);
  }

  async update_inventory(args: z.infer<typeof OrderWriteToolSchemas.update_inventory.schema>) {
    const result = await this.shopifyService.updateInventory(
      args.inventory_item_id,
      args.location_id,
      args.available,
    );
    return formatMcpResponse(
      result,
      `Inventory for item ${args.inventory_item_id} at location ${args.location_id} set to ${args.available}.`,
    );
  }
}
