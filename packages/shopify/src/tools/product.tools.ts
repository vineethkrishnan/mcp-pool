import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const ProductToolSchemas = {
  list_products: {
    description:
      "Lists products from the Shopify store. Returns product summaries including title, status, vendor, product type, and variant count.",
    schema: z.object({
      limit: z.number().optional().default(50).describe("Number of products to return (max 250)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_product: {
    description:
      "Retrieves full details for a specific Shopify product including all variants (with prices, SKUs, inventory quantities), images, and options.",
    schema: z.object({
      product_id: z.string().describe("The Shopify product ID (numeric, e.g., '789')."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class ProductTools {
  constructor(private shopifyService: ShopifyService) {}

  async list_products(args: z.infer<typeof ProductToolSchemas.list_products.schema>) {
    const products = await this.shopifyService.listProducts(args.limit);
    return formatMcpResponse(products);
  }

  async get_product(args: z.infer<typeof ProductToolSchemas.get_product.schema>) {
    const product = await this.shopifyService.getProduct(args.product_id);
    return formatMcpResponse(product);
  }
}
