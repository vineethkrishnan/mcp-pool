import { PagerDutyConfig } from "../common/types";

export class PagerDutyService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: PagerDutyConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    path: string,
    params?: Record<string, string | number | string[]>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;

        // PagerDuty uses repeated params for arrays (e.g., statuses[]=triggered&statuses[]=acknowledged)
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(`${key}[]`, item);
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token token=${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.pagerduty+json;version=2",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error(
            "Authentication failed. Check your PAGERDUTY_API_KEY. If using EU, verify PAGERDUTY_BASE_URL matches your account region.",
          );
        case 403:
          throw new Error("Access denied. API key may lack required permissions.");
        case 404:
          throw new Error("Not found. Check the ID and ensure it exists.");
        case 429: {
          const retryAfter = response.headers.get("Ratelimit-Reset") ?? "unknown";
          throw new Error(`Rate limited by PagerDuty. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `PagerDuty API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Incidents
  // ===========================================================================

  async listIncidents(statuses?: string[], limit: number = 25): Promise<unknown[]> {
    const params: Record<string, string | number | string[]> = {
      limit,
      offset: 0,
    };
    if (statuses && statuses.length > 0) params.statuses = statuses;

    const response = await this.request<{ incidents: unknown[] }>("/incidents", params);
    return response.incidents;
  }

  async getIncident(incidentId: string): Promise<unknown> {
    const response = await this.request<{ incident: unknown }>(`/incidents/${incidentId}`);
    return response.incident;
  }

  // ===========================================================================
  // Services
  // ===========================================================================

  async listServices(limit: number = 25): Promise<unknown[]> {
    const params: Record<string, string | number> = {
      limit,
      offset: 0,
    };

    const response = await this.request<{ services: unknown[] }>("/services", params);
    return response.services;
  }

  async getService(serviceId: string): Promise<unknown> {
    const response = await this.request<{ service: unknown }>(`/services/${serviceId}`);
    return response.service;
  }

  // ===========================================================================
  // On-Call
  // ===========================================================================

  async listOncalls(scheduleIds?: string[], limit: number = 25): Promise<unknown[]> {
    const params: Record<string, string | number | string[]> = {
      limit,
      offset: 0,
    };
    if (scheduleIds && scheduleIds.length > 0) params.schedule_ids = scheduleIds;

    const response = await this.request<{ oncalls: unknown[] }>("/oncalls", params);
    return response.oncalls;
  }

  async getSchedule(scheduleId: string): Promise<unknown> {
    const response = await this.request<{ schedule: unknown }>(`/schedules/${scheduleId}`);
    return response.schedule;
  }
}
