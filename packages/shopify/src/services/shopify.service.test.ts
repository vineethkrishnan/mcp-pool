import { ShopifyService } from "./shopify.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ShopifyService", () => {
  let service: ShopifyService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new ShopifyService({
      storeUrl: "my-store.myshopify.com",
      accessToken: "shpat_test_token",
    });
  });

  function mockResponse(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: "OK",
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: {
        get: () => null,
      },
    });
  }

  function mockErrorResponse(status: number, body = "", headers: Record<string, string> = {}) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText: "Error",
      json: async () => ({}),
      text: async () => body,
      headers: {
        get: (name: string) => headers[name] ?? null,
      },
    });
  }

  function getCalledUrl(): string {
    return mockFetch.mock.calls[0][0] as string;
  }

  function getCalledHeaders(): Record<string, string> {
    return mockFetch.mock.calls[0][1].headers;
  }

  // =========================================================================
  // Constructor / URL normalization
  // =========================================================================

  describe("constructor", () => {
    it("builds correct base URL from plain store domain", async () => {
      mockResponse({ shop: {} });
      await service.getShop();
      expect(getCalledUrl()).toBe("https://my-store.myshopify.com/admin/api/2024-01/shop.json");
    });

    it("strips https:// prefix from store URL", async () => {
      const svc = new ShopifyService({
        storeUrl: "https://my-store.myshopify.com",
        accessToken: "tok",
      });
      mockResponse({ shop: {} });
      await svc.getShop();
      expect(getCalledUrl()).toBe("https://my-store.myshopify.com/admin/api/2024-01/shop.json");
    });

    it("strips http:// prefix from store URL", async () => {
      const svc = new ShopifyService({
        storeUrl: "http://my-store.myshopify.com",
        accessToken: "tok",
      });
      mockResponse({ shop: {} });
      await svc.getShop();
      expect(getCalledUrl()).toBe("https://my-store.myshopify.com/admin/api/2024-01/shop.json");
    });

    it("strips trailing slashes from store URL", async () => {
      const svc = new ShopifyService({
        storeUrl: "my-store.myshopify.com///",
        accessToken: "tok",
      });
      mockResponse({ shop: {} });
      await svc.getShop();
      expect(getCalledUrl()).toBe("https://my-store.myshopify.com/admin/api/2024-01/shop.json");
    });

    it("strips both protocol and trailing slash", async () => {
      const svc = new ShopifyService({
        storeUrl: "https://my-store.myshopify.com/",
        accessToken: "tok",
      });
      mockResponse({ shop: {} });
      await svc.getShop();
      expect(getCalledUrl()).toBe("https://my-store.myshopify.com/admin/api/2024-01/shop.json");
    });
  });

  // =========================================================================
  // Request headers
  // =========================================================================

  describe("request headers", () => {
    it("sets X-Shopify-Access-Token header", async () => {
      mockResponse({ shop: {} });
      await service.getShop();

      const headers = getCalledHeaders();
      expect(headers["X-Shopify-Access-Token"]).toBe("shpat_test_token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.getShop()).rejects.toThrow(
        "Authentication failed. Check your SHOPIFY_ACCESS_TOKEN.",
      );
    });

    it("throws scope hint on 403", async () => {
      mockErrorResponse(403);
      await expect(service.getShop()).rejects.toThrow(
        "Access denied. Token may lack required scopes (read_orders, read_products, read_customers).",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getOrder("999")).rejects.toThrow(
        "Not found. Check the ID and ensure you have access.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "2" });
      await expect(service.getShop()).rejects.toThrow(
        "Rate limited by Shopify. Retry after 2 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.getShop()).rejects.toThrow(
        "Rate limited by Shopify. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.getShop()).rejects.toThrow(
        "Shopify API error (500): Internal Server Error",
      );
    });

    it("falls back to statusText when error body is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: async () => ({}),
        text: async () => "",
        headers: { get: () => null },
      });
      await expect(service.getShop()).rejects.toThrow("Shopify API error (502): Bad Gateway");
    });
  });

  // =========================================================================
  // Orders
  // =========================================================================

  describe("listOrders()", () => {
    it("calls correct endpoint with default limit", async () => {
      mockResponse({ orders: [{ id: 1 }] });
      const result = await service.listOrders();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/admin/api/2024-01/orders.json");
      expect(url.searchParams.get("limit")).toBe("50");
      expect(result).toEqual([{ id: 1 }]);
    });

    it("includes status parameter when provided", async () => {
      mockResponse({ orders: [] });
      await service.listOrders("open", 10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("status")).toBe("open");
      expect(url.searchParams.get("limit")).toBe("10");
    });

    it("unwraps the orders wrapper", async () => {
      mockResponse({ orders: [{ id: 1 }, { id: 2 }] });
      const result = await service.listOrders();
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe("getOrder()", () => {
    it("calls correct endpoint with order ID", async () => {
      const order = { id: 12345, name: "#1001" };
      mockResponse({ order });

      const result = await service.getOrder("12345");

      expect(getCalledUrl()).toContain("/orders/12345.json");
      expect(result).toEqual(order);
    });
  });

  // =========================================================================
  // Products
  // =========================================================================

  describe("listProducts()", () => {
    it("calls correct endpoint with default limit", async () => {
      mockResponse({ products: [{ id: 1 }] });
      const result = await service.listProducts();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/admin/api/2024-01/products.json");
      expect(url.searchParams.get("limit")).toBe("50");
      expect(result).toEqual([{ id: 1 }]);
    });

    it("respects custom limit", async () => {
      mockResponse({ products: [] });
      await service.listProducts(10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("10");
    });
  });

  describe("getProduct()", () => {
    it("calls correct endpoint with product ID", async () => {
      const product = { id: 789, title: "T-Shirt" };
      mockResponse({ product });

      const result = await service.getProduct("789");

      expect(getCalledUrl()).toContain("/products/789.json");
      expect(result).toEqual(product);
    });
  });

  // =========================================================================
  // Customers
  // =========================================================================

  describe("listCustomers()", () => {
    it("calls correct endpoint with default limit", async () => {
      mockResponse({ customers: [{ id: 1 }] });
      const result = await service.listCustomers();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/admin/api/2024-01/customers.json");
      expect(url.searchParams.get("limit")).toBe("50");
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe("getCustomer()", () => {
    it("calls correct endpoint with customer ID", async () => {
      const customer = { id: 456, email: "john@example.com" };
      mockResponse({ customer });

      const result = await service.getCustomer("456");

      expect(getCalledUrl()).toContain("/customers/456.json");
      expect(result).toEqual(customer);
    });
  });

  // =========================================================================
  // Shop
  // =========================================================================

  describe("getShop()", () => {
    it("calls correct endpoint and unwraps shop wrapper", async () => {
      const shop = { name: "My Store", domain: "my-store.myshopify.com" };
      mockResponse({ shop });

      const result = await service.getShop();

      expect(getCalledUrl()).toContain("/shop.json");
      expect(result).toEqual(shop);
    });
  });
});
