import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const ProductWriteToolSchemas = {
  create_product: {
    description:
      "Creates a new product in the Shopify store. Returns the created product with its ID, variants, and all metadata.",
    schema: z.object({
      title: z.string().describe("The product title."),
      body_html: z.string().optional().describe("Product description in HTML format."),
      vendor: z.string().optional().describe("The product vendor name."),
      product_type: z.string().optional().describe("The product type (e.g., 'Shoes', 'T-Shirts')."),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated list of tags (e.g., 'sale, summer, new')."),
    }),
    annotations: {
      title: "Create Product",
      idempotentHint: false,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  update_product: {
    description:
      "Updates an existing product in the Shopify store. Only provided fields will be changed. Returns the updated product.",
    schema: z.object({
      product_id: z.string().describe("The Shopify product ID (numeric, e.g., '789')."),
      title: z.string().optional().describe("New product title."),
      body_html: z.string().optional().describe("New product description in HTML format."),
      tags: z
        .string()
        .optional()
        .describe("New comma-separated list of tags (replaces existing tags)."),
    }),
    annotations: {
      title: "Update Product",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class ProductWriteTools {
  constructor(private shopifyService: ShopifyService) {}

  async create_product(args: z.infer<typeof ProductWriteToolSchemas.create_product.schema>) {
    const product = await this.shopifyService.createProduct(
      args.title,
      args.body_html,
      args.vendor,
      args.product_type,
      args.tags,
    );
    return formatMcpResponse(product, `Product "${args.title}" created successfully.`);
  }

  async update_product(args: z.infer<typeof ProductWriteToolSchemas.update_product.schema>) {
    const product = await this.shopifyService.updateProduct(
      args.product_id,
      args.title,
      args.body_html,
      args.tags,
    );
    return formatMcpResponse(product, `Product ${args.product_id} updated successfully.`);
  }
}
