import { ShopifyConfig } from "../common/types";

export class ShopifyService {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: ShopifyConfig) {
    // Normalize storeUrl: strip protocol and trailing slash
    const store = config.storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    this.baseUrl = `https://${store}/admin/api/2024-01`;
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
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
        "X-Shopify-Access-Token": this.accessToken,
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

  // Shop
  async getShop(): Promise<unknown> {
    const data = await this.request<{ shop: unknown }>("/shop.json");
    return data.shop;
  }
}
