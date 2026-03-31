#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
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
const AllToolSchemas = {
  ...CustomerToolSchemas,
  ...PaymentToolSchemas,
  ...BillingToolSchemas,
  ...ProductToolSchemas,
  ...CheckoutToolSchemas,
  ...ReportingToolSchemas,
  ...TaxToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "stripe-mcp",
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Handler for listing available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(AllToolSchemas).map(([name, config]) => ({
      name,
      description: config.description,
      inputSchema: z.toJSONSchema(config.schema),
    })),
  };
});

/**
 * Handler for calling specific tools.
 * Routes the AI's request to the correct tool implementation.
 */
// Build a registry mapping tool names to handler functions
type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;

const toolRegistry: Record<string, ToolHandler> = {};

for (const name of Object.keys(CustomerToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.customers[name as keyof CustomerTools] as ToolHandler)(args);
}
for (const name of Object.keys(PaymentToolSchemas)) {
  toolRegistry[name] = (args) => (tools.payments[name as keyof PaymentTools] as ToolHandler)(args);
}
for (const name of Object.keys(BillingToolSchemas)) {
  toolRegistry[name] = (args) => (tools.billing[name as keyof BillingTools] as ToolHandler)(args);
}
for (const name of Object.keys(ProductToolSchemas)) {
  toolRegistry[name] = (args) => (tools.products[name as keyof ProductTools] as ToolHandler)(args);
}
for (const name of Object.keys(CheckoutToolSchemas)) {
  toolRegistry[name] = (args) => (tools.checkout[name as keyof CheckoutTools] as ToolHandler)(args);
}
for (const name of Object.keys(ReportingToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.reporting[name as keyof ReportingTools] as ToolHandler)(args);
}
for (const name of Object.keys(TaxToolSchemas)) {
  toolRegistry[name] = (args) => (tools.tax[name as keyof TaxTools] as ToolHandler)(args);
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const handler = toolRegistry[name];

    if (!handler) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }

    return await handler(args ?? {});
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
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
