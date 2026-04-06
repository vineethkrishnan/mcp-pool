import { DatadogConfig } from "../common/types";

export class DatadogService {
  private baseUrl: string;
  private apiKey: string;
  private appKey: string;

  constructor(config: DatadogConfig) {
    // Construct site-aware base URL: https://api.${DD_SITE}
    const site = config.site.replace(/\/+$/, "");
    this.baseUrl = `https://api.${site}`;
    this.apiKey = config.apiKey;
    this.appKey = config.appKey;
  }

  private async request<T>(
    version: "v1" | "v2",
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/${version}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "DD-API-KEY": this.apiKey,
        "DD-APPLICATION-KEY": this.appKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error(
            "Authentication failed. Check your DD_API_KEY. If using a non-US1 site, ensure DD_SITE matches where your keys were created.",
          );
        case 403:
          throw new Error(
            "Access denied. Check your DD_APP_KEY permissions. Ensure the application key has read access to the requested resource.",
          );
        case 404:
          throw new Error(
            "Not found. Check the ID and ensure the resource exists in your DD_SITE region.",
          );
        case 429: {
          const resetHeader = response.headers.get("X-RateLimit-Reset") ?? "unknown";
          throw new Error(`Rate limited by Datadog. Retry after ${resetHeader} seconds.`);
        }
        default:
          throw new Error(
            `Datadog API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  private async mutateRequest<T>(
    method: "POST" | "PUT" | "PATCH",
    version: "v1" | "v2",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/${version}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "DD-API-KEY": this.apiKey,
        "DD-APPLICATION-KEY": this.appKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error(
            "Authentication failed. Check your DD_API_KEY. If using a non-US1 site, ensure DD_SITE matches where your keys were created.",
          );
        case 403:
          throw new Error(
            "Access denied. Check your DD_APP_KEY permissions. Ensure the application key has write access to the requested resource.",
          );
        case 404:
          throw new Error(
            "Not found. Check the ID and ensure the resource exists in your DD_SITE region.",
          );
        case 429: {
          const resetHeader = response.headers.get("X-RateLimit-Reset") ?? "unknown";
          throw new Error(`Rate limited by Datadog. Retry after ${resetHeader} seconds.`);
        }
        default:
          throw new Error(
            `Datadog API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Monitors
  // ===========================================================================

  async listMonitors(query?: string, limit: number = 25): Promise<unknown[]> {
    const params: Record<string, string | number> = { page_size: limit };
    if (query) params.query = query;
    return this.request<unknown[]>("v1", "/monitor", params);
  }

  async getMonitor(monitorId: number): Promise<unknown> {
    return this.request<unknown>("v1", `/monitor/${monitorId}`);
  }

  async searchMonitors(query: string, limit: number = 25): Promise<unknown> {
    return this.request<unknown>("v1", "/monitor/search", {
      query,
      per_page: limit,
    });
  }

  // ===========================================================================
  // Metrics
  // ===========================================================================

  async queryMetrics(query: string, from: number, to: number): Promise<unknown> {
    return this.request<unknown>("v1", "/query", {
      query,
      from,
      to,
    });
  }

  // ===========================================================================
  // Events
  // ===========================================================================

  async listEvents(start: number, end: number, limit: number = 25): Promise<unknown> {
    return this.request<unknown>("v2", "/events", {
      "filter[from]": start,
      "filter[to]": end,
      "page[limit]": limit,
    });
  }

  async getEvent(eventId: number): Promise<unknown> {
    return this.request<unknown>("v2", `/events/${eventId}`);
  }

  // ===========================================================================
  // Monitor actions (write)
  // ===========================================================================

  async muteMonitor(monitorId: string, end?: number, scope?: string): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (end !== undefined) body.end = end;
    if (scope) body.scope = scope;
    return this.mutateRequest<unknown>("POST", "v1", `/monitor/${monitorId}/mute`, body);
  }

  async unmuteMonitor(monitorId: string, scope?: string): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (scope) body.scope = scope;
    return this.mutateRequest<unknown>("POST", "v1", `/monitor/${monitorId}/unmute`, body);
  }

  async createDowntime(
    scope: string,
    start?: number,
    end?: number,
    message?: string,
    monitorId?: number,
  ): Promise<unknown> {
    const body: Record<string, unknown> = { scope };
    if (start !== undefined) body.start = start;
    if (end !== undefined) body.end = end;
    if (message) body.message = message;
    if (monitorId !== undefined) body.monitor_id = monitorId;
    return this.mutateRequest<unknown>("POST", "v1", "/downtime", body);
  }
}
