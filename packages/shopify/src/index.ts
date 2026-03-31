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
import { ShopifyService } from "./services/shopify.service";
import { OrderTools, OrderToolSchemas } from "./tools/order.tools";
import { ProductTools, ProductToolSchemas } from "./tools/product.tools";
import { CustomerTools, CustomerToolSchemas } from "./tools/customer.tools";
import { ShopTools, ShopToolSchemas } from "./tools/shop.tools";

// Validate required config
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_STORE_URL) {
  console.error("SHOPIFY_STORE_URL environment variable is required.");
  process.exit(1);
}

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error("SHOPIFY_ACCESS_TOKEN environment variable is required.");
  process.exit(1);
}

const shopifyService = new ShopifyService({
  storeUrl: SHOPIFY_STORE_URL,
  accessToken: SHOPIFY_ACCESS_TOKEN,
});

// Initialize tool classes
const tools = {
  orders: new OrderTools(shopifyService),
  products: new ProductTools(shopifyService),
  customers: new CustomerTools(shopifyService),
  shop: new ShopTools(shopifyService),
};

// Combine all schemas
const AllToolSchemas = {
  ...OrderToolSchemas,
  ...ProductToolSchemas,
  ...CustomerToolSchemas,
  ...ShopToolSchemas,
} as const;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../package.json");

const server = new Server(
  {
    name: "shopify-mcp",
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
 */
type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

const toolRegistry: Record<string, ToolHandler> = {};

for (const name of Object.keys(OrderToolSchemas)) {
  toolRegistry[name] = (args) => (tools.orders[name as keyof OrderTools] as ToolHandler)(args);
}
for (const name of Object.keys(ProductToolSchemas)) {
  toolRegistry[name] = (args) => (tools.products[name as keyof ProductTools] as ToolHandler)(args);
}
for (const name of Object.keys(CustomerToolSchemas)) {
  toolRegistry[name] = (args) =>
    (tools.customers[name as keyof CustomerTools] as ToolHandler)(args);
}
for (const name of Object.keys(ShopToolSchemas)) {
  toolRegistry[name] = (args) => (tools.shop[name as keyof ShopTools] as ToolHandler)(args);
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
  console.error("Shopify MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
