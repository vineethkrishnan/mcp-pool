import { z } from "zod";
import { StripeService } from "../services/stripe.service";
import { formatMcpResponse } from "../common/utils";

export const CheckoutToolSchemas = {
  get_checkout_session: {
    description: "Retrieves details of a specific Stripe Checkout session.",
    schema: z.object({
      id: z.string().describe("The ID of the session (e.g., 'cs_123')."),
    }),
  },
  list_checkout_sessions: {
    description: "Lists recent Checkout sessions.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of sessions to return (max 100)."),
    }),
  },
};

export class CheckoutTools {
  constructor(private stripeService: StripeService) {}

  async get_checkout_session(
    args: z.infer<typeof CheckoutToolSchemas.get_checkout_session.schema>,
  ) {
    const data = await this.stripeService.getCheckoutSession(args.id);
    return formatMcpResponse(data);
  }

  async list_checkout_sessions(
    args: z.infer<typeof CheckoutToolSchemas.list_checkout_sessions.schema>,
  ) {
    const data = await this.stripeService.listCheckoutSessions(args.limit);
    return formatMcpResponse(data);
  }
}

// --- Reporting ---
export const ReportingToolSchemas = {
  get_payout: {
    description: "Retrieves details of a specific Stripe payout to your bank account.",
    schema: z.object({
      id: z.string().describe("The ID of the payout (e.g., 'po_123')."),
    }),
  },
  list_payouts: {
    description: "Lists recent payouts.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of payouts to return (max 100)."),
    }),
  },
  get_dispute: {
    description: "Retrieves details of a specific dispute (chargeback).",
    schema: z.object({
      id: z.string().describe("The ID of the dispute (e.g., 'dp_123')."),
    }),
  },
  list_disputes: {
    description: "Lists recent disputes.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of disputes to return (max 100)."),
    }),
  },
};

export class ReportingTools {
  constructor(private stripeService: StripeService) {}

  async get_payout(args: z.infer<typeof ReportingToolSchemas.get_payout.schema>) {
    const data = await this.stripeService.getPayout(args.id);
    return formatMcpResponse(data);
  }

  async list_payouts(args: z.infer<typeof ReportingToolSchemas.list_payouts.schema>) {
    const data = await this.stripeService.listPayouts(args.limit);
    return formatMcpResponse(data);
  }

  async get_dispute(args: z.infer<typeof ReportingToolSchemas.get_dispute.schema>) {
    const data = await this.stripeService.getDispute(args.id);
    return formatMcpResponse(data);
  }

  async list_disputes(args: z.infer<typeof ReportingToolSchemas.list_disputes.schema>) {
    const data = await this.stripeService.listDisputes(args.limit);
    return formatMcpResponse(data);
  }
}

// --- Tax ---
export const TaxToolSchemas = {
  get_tax_rate: {
    description: "Retrieves details of a specific tax rate.",
    schema: z.object({
      id: z.string().describe("The ID of the tax rate (e.g., 'txr_123')."),
    }),
  },
  list_tax_rates: {
    description: "Lists active tax rates.",
    schema: z.object({
      limit: z.number().optional().default(10).describe("Number of tax rates to return (max 100)."),
    }),
  },
};

export class TaxTools {
  constructor(private stripeService: StripeService) {}

  async get_tax_rate(args: z.infer<typeof TaxToolSchemas.get_tax_rate.schema>) {
    const data = await this.stripeService.getTaxRate(args.id);
    return formatMcpResponse(data);
  }

  async list_tax_rates(args: z.infer<typeof TaxToolSchemas.list_tax_rates.schema>) {
    const data = await this.stripeService.listTaxRates(args.limit);
    return formatMcpResponse(data);
  }
}
