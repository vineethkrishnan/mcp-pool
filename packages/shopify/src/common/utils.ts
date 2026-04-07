import { McpToolResponse } from "./types";

const SHOPIFY_STRIP_KEYS = [
  "admin_graphql_api_id",
  "presentment_prices",
  "tax_lines",
  "discount_allocations",
  "duties",
  "payment_terms",
];

/**
 * Formats a money amount string with currency symbol.
 * Shopify returns prices as strings (e.g., "29.99") with a separate currency field.
 */
export function formatMoney(amount: string | null | undefined, currency: string): string {
  if (!amount) return "";
  const num = parseFloat(amount);
  if (isNaN(num)) return "";

  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "\u20AC",
    GBP: "\u00A3",
    CAD: "CA$",
    AUD: "A$",
    JPY: "\u00A5",
  };
  const symbol = symbols[currency] ?? "";
  const formatted = currency === "JPY" ? Math.round(num).toString() : num.toFixed(2);
  return `${symbol}${formatted} ${currency}`;
}

/**
 * Simplifies product variant objects to essential fields.
 */
export function simplifyVariants(
  variants: Record<string, unknown>[],
  currency: string,
): Record<string, unknown>[] {
  if (!Array.isArray(variants)) return [];
  return variants.map((variant) => ({
    title: variant.title,
    price: formatMoney(variant.price as string, currency),
    sku: variant.sku,
    inventory_quantity: variant.inventory_quantity,
  }));
}

/**
 * Simplifies order line items to essential fields.
 */
export function simplifyLineItems(
  lineItems: Record<string, unknown>[],
  currency: string,
): Record<string, unknown>[] {
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((item) => ({
    product: item.title,
    variant: item.variant_title,
    quantity: item.quantity,
    price: formatMoney(item.price as string, currency),
    sku: item.sku,
  }));
}

/**
 * Recursively removes Shopify internal metadata keys from an object.
 */
export function stripShopifyMetadata(obj: unknown, keys: string[] = SHOPIFY_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripShopifyMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripShopifyMetadata(value, keys);
  }
  return result;
}

/**
 * Composes all Shopify-specific transformations for LLM optimization.
 */
export function transformShopifyResponse(data: unknown): unknown {
  return stripShopifyMetadata(data);
}

/**
 * Transforms Shopify data and wraps it in the MCP tool response format.
 * When actionMessage is provided, it is prepended as a summary line for write operations.
 */
export function formatMcpResponse(data: unknown, actionMessage?: string): McpToolResponse {
  const transformed = transformShopifyResponse(data);
  const json = JSON.stringify(transformed, null, 2);
  const text = actionMessage ? `${actionMessage}\n\n${json}` : json;
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * Wraps an error in the MCP tool error response format.
 */
export function formatMcpError(error: unknown): McpToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
