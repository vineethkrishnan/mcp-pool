import { TokenProvider } from "@vineethnkrishnan/oauth-core";
import { ShopifyConfig } from "../common/types";

export class ShopifyService {
  private baseUrl: string;
  private tokenProvider: TokenProvider;

  constructor(config: ShopifyConfig) {
    // Normalize storeUrl: strip protocol and trailing slash
    const store = config.storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    this.baseUrl = `https://${store}/admin/api/2024-01`;
    this.tokenProvider = config.tokenProvider;
  }

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your SHOPIFY_ACCESS_TOKEN.");
        case 403:
          throw new Error(
            "Access denied. Token may lack required scopes (read_orders, read_products, read_customers).",
          );
        case 404:
          throw new Error("Not found. Check the ID and ensure you have access.");
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Shopify. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Shopify API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  private async mutateRequest<T>(
    method: "POST" | "PUT" | "PATCH",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your SHOPIFY_ACCESS_TOKEN.");
        case 403:
          throw new Error(
            "Access denied. Token may lack required scopes (write_orders, write_products).",
          );
        case 404:
          throw new Error("Not found. Check the ID and ensure you have access.");
        case 422:
          throw new Error(`Validation error: ${errorBody}`);
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Shopify. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Shopify API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // Orders
  async listOrders(status?: string, limit: number = 50): Promise<unknown[]> {
    const params: Record<string, string | number> = { limit };
    if (status) params.status = status;
    const data = await this.request<{ orders: unknown[] }>("/orders.json", params);
    return data.orders;
  }

  async getOrder(orderId: string): Promise<unknown> {
    const data = await this.request<{ order: unknown }>(`/orders/${orderId}.json`);
    return data.order;
  }

  // Products
  async listProducts(limit: number = 50): Promise<unknown[]> {
    const data = await this.request<{ products: unknown[] }>("/products.json", { limit });
    return data.products;
  }

  async getProduct(productId: string): Promise<unknown> {
    const data = await this.request<{ product: unknown }>(`/products/${productId}.json`);
    return data.product;
  }

  // Customers
  async listCustomers(limit: number = 50): Promise<unknown[]> {
    const data = await this.request<{ customers: unknown[] }>("/customers.json", { limit });
    return data.customers;
  }

  async getCustomer(customerId: string): Promise<unknown> {
    const data = await this.request<{ customer: unknown }>(`/customers/${customerId}.json`);
    return data.customer;
  }

  async updateOrderTags(orderId: string, tags: string): Promise<unknown> {
    const data = await this.mutateRequest<{ order: unknown }>("PUT", `/orders/${orderId}.json`, {
      order: { id: orderId, tags },
    });
    return data.order;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (reason) body.reason = reason;
    const data = await this.mutateRequest<{ order: unknown }>(
      "POST",
      `/orders/${orderId}/cancel.json`,
      body,
    );
    return data.order;
  }

  // Products (write)
  async createProduct(
    title: string,
    bodyHtml?: string,
    vendor?: string,
    productType?: string,
    tags?: string,
  ): Promise<unknown> {
    const product: Record<string, unknown> = { title };
    if (bodyHtml) product.body_html = bodyHtml;
    if (vendor) product.vendor = vendor;
    if (productType) product.product_type = productType;
    if (tags) product.tags = tags;
    const data = await this.mutateRequest<{ product: unknown }>("POST", "/products.json", {
      product,
    });
    return data.product;
  }

  async updateProduct(
    productId: string,
    title?: string,
    bodyHtml?: string,
    tags?: string,
  ): Promise<unknown> {
    const product: Record<string, unknown> = {};
    if (title) product.title = title;
    if (bodyHtml) product.body_html = bodyHtml;
    if (tags) product.tags = tags;
    const data = await this.mutateRequest<{ product: unknown }>(
      "PUT",
      `/products/${productId}.json`,
      { product },
    );
    return data.product;
  }

  // Inventory
  async updateInventory(
    inventoryItemId: string,
    locationId: string,
    available: number,
  ): Promise<unknown> {
    return this.mutateRequest<unknown>("POST", "/inventory_levels/set.json", {
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      available,
    });
  }

  // Shop
  async getShop(): Promise<unknown> {
    const data = await this.request<{ shop: unknown }>("/shop.json");
    return data.shop;
  }
}
