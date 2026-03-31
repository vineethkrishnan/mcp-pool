#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { StripeService } from "./services/stripe.service";
import { CustomerTools, CustomerToolSchemas } from "./tools/customer.tools";
import { PaymentTools, PaymentToolSchemas } from "./tools/payment.tools";
import { BillingTools, BillingToolSchemas } from "./tools/billing.tools";
import { ProductTools, ProductToolSchemas } from "./tools/product.tools";
import {
  CheckoutTools,
  CheckoutToolSchemas,
  ReportingTools,
  ReportingToolSchemas,
  TaxTools,
  TaxToolSchemas,
} from "./tools/reporting.tools";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY environment variable is required.");
  process.exit(1);
}

const stripeService = new StripeService(STRIPE_SECRET_KEY);

// Initialize tool classes
const tools = {
  customers: new CustomerTools(stripeService),
  payments: new PaymentTools(stripeService),
  billing: new BillingTools(stripeService),
  products: new ProductTools(stripeService),
  checkout: new CheckoutTools(stripeService),
  reporting: new ReportingTools(stripeService),
  tax: new TaxTools(stripeService),
};

// Combine all schemas
const AllToolSchemas: any = {
  ...CustomerToolSchemas,
  ...PaymentToolSchemas,
  ...BillingToolSchemas,
  ...ProductToolSchemas,
  ...CheckoutToolSchemas,
  ...ReportingToolSchemas,
  ...TaxToolSchemas,
};

const server = new Server(
  {
    name: "stripe-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(AllToolSchemas).map(([name, config]: [string, any]) => ({
      name,
      description: config.description,
      inputSchema: config.schema,
    })),
  };
});

/**
 * Handler for calling specific tools.
 * Routes the AI's request to the correct tool implementation.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Route to the appropriate tool instance
    // (This could be further refactored for dynamic routing, but for now we'll keep it explicit)
    
    // Customers
    if (name in CustomerToolSchemas) return await (tools.customers as any)[name](args);
    // Payments
    if (name in PaymentToolSchemas) return await (tools.payments as any)[name](args);
    // Billing
    if (name in BillingToolSchemas) return await (tools.billing as any)[name](args);
    // Products
    if (name in ProductToolSchemas) return await (tools.products as any)[name](args);
    // Checkout
    if (name in CheckoutToolSchemas) return await (tools.checkout as any)[name](args);
    // Reporting
    if (name in ReportingToolSchemas) return await (tools.reporting as any)[name](args);
    // Tax
    if (name in TaxToolSchemas) return await (tools.tax as any)[name](args);

    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server using Stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stripe MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
