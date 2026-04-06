import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const CustomerWriteToolSchemas = {
  update_customer_metadata: {
    description:
      "Updates the metadata key-value pairs on a Stripe customer. Existing keys not included in the request are left unchanged.",
    schema: z.object({
      customer_id: z.string().describe("The ID of the customer to update (e.g., 'cus_123')."),
      metadata: z
        .record(z.string(), z.string())
        .describe("Key-value pairs to set on the customer's metadata."),
    }),
    annotations: {
      title: "Update Customer Metadata",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
};

export class CustomerWriteTools {
  constructor(private stripeService: StripeService) {}

  async update_customer_metadata(
    args: z.infer<typeof CustomerWriteToolSchemas.update_customer_metadata.schema>,
  ) {
    const data = await this.stripeService.updateCustomerMetadata(args.customer_id, args.metadata);
    return formatMcpResponse(data, "Customer metadata updated successfully.");
  }
}
