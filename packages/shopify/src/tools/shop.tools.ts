import { z } from "zod";
import { ShopifyService } from "../services/shopify.service";
import { formatMcpResponse } from "../common/utils";

export const ShopToolSchemas = {
  get_shop_info: {
    description:
      "Retrieves shop metadata including name, email, domain, plan, currency, timezone, and configured shipping zones.",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
  },
};

export class ShopTools {
  constructor(private shopifyService: ShopifyService) {}

  async get_shop_info(_args: z.infer<typeof ShopToolSchemas.get_shop_info.schema>) {
    const shop = await this.shopifyService.getShop();
    return formatMcpResponse(shop);
  }
}
