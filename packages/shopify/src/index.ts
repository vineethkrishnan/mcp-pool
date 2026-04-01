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
import { createAuthProvider } from "@vineethnkrishnan/oauth-core";
import { AUTH_CONFIG } from "./auth-config";
import { ShopifyService } from "./services/shopify.service";
import { OrderTools, OrderToolSchemas } from "./tools/order.tools";
import { ProductTools, ProductToolSchemas } from "./tools/product.tools";
import { CustomerTools, CustomerToolSchemas } from "./tools/customer.tools";
import { ShopTools, ShopToolSchemas } from "./tools/shop.tools";

// Route CLI subcommands before starting MCP server
if (process.argv[2] === "auth") {
  createAuthProvider(AUTH_CONFIG).handleCli(process.argv.slice(3));
} else {
  const auth = createAuthProvider(AUTH_CONFIG);

  // Validate Shopify store URL
  const storeUrl = process.env.SHOPIFY_STORE_URL;
  if (!storeUrl) {
    console.error("SHOPIFY_STORE_URL environment variable is required.");
    process.exit(1);
  }

  const shopifyService = new ShopifyService({
    storeUrl,
    tokenProvider: auth,
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

  const server = new Server({ name: "shopify-mcp", version }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.entries(AllToolSchemas).map(([name, config]) => ({
        name,
        description: config.description,
        inputSchema: z.toJSONSchema(config.schema),
      })),
    };
  });

  type ToolHandler = (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;

  const toolRegistry: Record<string, ToolHandler> = {};
  for (const name of Object.keys(OrderToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.orders[name as keyof typeof tools.orders] as ToolHandler)(args);
  }
  for (const name of Object.keys(ProductToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.products[name as keyof typeof tools.products] as ToolHandler)(args);
  }
  for (const name of Object.keys(CustomerToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.customers[name as keyof typeof tools.customers] as ToolHandler)(args);
  }
  for (const name of Object.keys(ShopToolSchemas)) {
    toolRegistry[name] = (args) =>
      (tools.shop[name as keyof typeof tools.shop] as ToolHandler)(args);
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

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Shopify MCP Server running on stdio");
  }

  main().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
