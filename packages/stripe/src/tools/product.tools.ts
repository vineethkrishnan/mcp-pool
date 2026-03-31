import { z } from 'zod';
import { StripeService } from '../services/stripe.service';

export const ProductToolSchemas = {
  get_product: {
    description: "Retrieves details of a specific Stripe product.",
    schema: z.object({
      id: z.string().describe("The ID of the product (e.g., 'prod_123')."),
    }),
  },
  list_products: {
    description: "Lists active products. Useful for checking the product catalog.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of products to return (max 100)."),
    }),
  },
  get_price: {
    description: "Retrieves details of a specific price object.",
    schema: z.object({
      id: z.string().describe("The ID of the price (e.g., 'price_123')."),
    }),
  },
  list_prices: {
    description: "Lists prices. Useful for checking available pricing plans.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of prices to return (max 100)."),
    }),
  },
};

export class ProductTools {
  constructor(private stripeService: StripeService) {}

  async get_product(args: z.infer<typeof ProductToolSchemas.get_product.schema>) {
    const data = await this.stripeService.getProduct(args.id);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  async list_products(args: z.infer<typeof ProductToolSchemas.list_products.schema>) {
    const data = await this.stripeService.listProducts(args.limit);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  async get_price(args: z.infer<typeof ProductToolSchemas.get_price.schema>) {
    const data = await this.stripeService.getPrice(args.id);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  async list_prices(args: z.infer<typeof ProductToolSchemas.list_prices.schema>) {
    const data = await this.stripeService.listPrices(args.limit);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
}
