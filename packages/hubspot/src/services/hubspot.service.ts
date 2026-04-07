import { TokenProvider } from "@vineethnkrishnan/oauth-core";
import { HubSpotConfig } from "../common/types";

const DEFAULT_CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "company",
  "lifecyclestage",
  "hs_lead_status",
];

const DEFAULT_DEAL_PROPERTIES = [
  "dealname",
  "amount",
  "dealstage",
  "pipeline",
  "closedate",
  "hs_lastmodifieddate",
];

const DEFAULT_COMPANY_PROPERTIES = [
  "name",
  "domain",
  "industry",
  "city",
  "state",
  "phone",
  "numberofemployees",
];

export class HubSpotService {
  private baseUrl = "https://api.hubapi.com";
  private tokenProvider: TokenProvider;

  constructor(config: HubSpotConfig) {
    this.tokenProvider = config.tokenProvider;
  }

  // ===========================================================================
  // HTTP methods
  // ===========================================================================

  private async request<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, item);
          }
        } else if (value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      this.handleErrorResponse(response.status, response.statusText, errorBody, response.headers);
    }

    return response.json() as Promise<T>;
  }

  private async postRequest<T>(path: string, body: unknown): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      this.handleErrorResponse(response.status, response.statusText, errorBody, response.headers);
    }

    return response.json() as Promise<T>;
  }

  private async patchRequest<T>(path: string, body: unknown): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      this.handleErrorResponse(response.status, response.statusText, errorBody, response.headers);
    }

    return response.json() as Promise<T>;
  }

  private handleErrorResponse(
    status: number,
    statusText: string,
    errorBody: string,
    headers: Headers,
  ): never {
    switch (status) {
      case 401:
        throw new Error("Authentication failed. Check your HUBSPOT_ACCESS_TOKEN.");
      case 403:
        throw new Error(
          "Access denied. Token may lack required scopes (crm.objects.contacts.read, crm.objects.deals.read).",
        );
      case 404:
        throw new Error("Not found. Check the ID and ensure you have access.");
      case 429: {
        const retryAfter = headers.get("Retry-After") ?? "unknown";
        throw new Error(
          `Rate limited by HubSpot (100 requests/10 seconds). Retry after ${retryAfter} seconds.`,
        );
      }
      default:
        throw new Error(`HubSpot API error (${status}): ${errorBody || statusText}`);
    }
  }

  // ===========================================================================
  // Contacts
  // ===========================================================================

  async listContacts(limit?: number, properties?: string[], after?: string): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_CONTACT_PROPERTIES;
    const params: Record<string, string | string[]> = {
      limit: String(limit ?? 10),
      properties: resolvedProperties,
    };
    if (after) params.after = after;

    return this.request<unknown>("/crm/v3/objects/contacts", params);
  }

  async getContact(
    contactId: string,
    properties?: string[],
    associations?: string[],
  ): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_CONTACT_PROPERTIES;
    const params: Record<string, string | string[]> = {
      properties: resolvedProperties,
    };
    if (associations) params.associations = associations;

    return this.request<unknown>(`/crm/v3/objects/contacts/${contactId}`, params);
  }

  async searchContacts(query: string, properties?: string[], limit?: number): Promise<unknown> {
    const body = {
      query,
      properties: properties ?? DEFAULT_CONTACT_PROPERTIES,
      limit: limit ?? 10,
    };

    return this.postRequest<unknown>("/crm/v3/objects/contacts/search", body);
  }

  async createContact(properties: Record<string, string>): Promise<unknown> {
    return this.postRequest<unknown>("/crm/v3/objects/contacts", { properties });
  }

  async updateContact(contactId: string, properties: Record<string, string>): Promise<unknown> {
    return this.patchRequest<unknown>(`/crm/v3/objects/contacts/${contactId}`, { properties });
  }

  // ===========================================================================
  // Deals
  // ===========================================================================

  async listDeals(limit?: number, properties?: string[], after?: string): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_DEAL_PROPERTIES;
    const params: Record<string, string | string[]> = {
      limit: String(limit ?? 10),
      properties: resolvedProperties,
    };
    if (after) params.after = after;

    return this.request<unknown>("/crm/v3/objects/deals", params);
  }

  async getDeal(dealId: string, properties?: string[], associations?: string[]): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_DEAL_PROPERTIES;
    const params: Record<string, string | string[]> = {
      properties: resolvedProperties,
    };
    if (associations) params.associations = associations;

    return this.request<unknown>(`/crm/v3/objects/deals/${dealId}`, params);
  }

  async createDeal(properties: Record<string, string>): Promise<unknown> {
    return this.postRequest<unknown>("/crm/v3/objects/deals", { properties });
  }

  async updateDealStage(dealId: string, dealstage: string, pipeline?: string): Promise<unknown> {
    const properties: Record<string, string> = { dealstage };
    if (pipeline) properties.pipeline = pipeline;

    return this.patchRequest<unknown>(`/crm/v3/objects/deals/${dealId}`, { properties });
  }

  // ===========================================================================
  // Notes
  // ===========================================================================

  async createNote(
    content: string,
    associations?: { contactId?: string; dealId?: string },
  ): Promise<unknown> {
    const associationsArray: Array<{
      to: { id: string };
      types: Array<{ associationCategory: string; associationTypeId: number }>;
    }> = [];

    if (associations?.contactId) {
      associationsArray.push({
        to: { id: associations.contactId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
      });
    }

    if (associations?.dealId) {
      associationsArray.push({
        to: { id: associations.dealId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }],
      });
    }

    const body: Record<string, unknown> = {
      properties: { hs_note_body: content },
    };

    if (associationsArray.length > 0) {
      body.associations = associationsArray;
    }

    return this.postRequest<unknown>("/crm/v3/objects/notes", body);
  }

  // ===========================================================================
  // Companies
  // ===========================================================================

  async listCompanies(limit?: number, properties?: string[], after?: string): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_COMPANY_PROPERTIES;
    const params: Record<string, string | string[]> = {
      limit: String(limit ?? 10),
      properties: resolvedProperties,
    };
    if (after) params.after = after;

    return this.request<unknown>("/crm/v3/objects/companies", params);
  }

  async getCompany(
    companyId: string,
    properties?: string[],
    associations?: string[],
  ): Promise<unknown> {
    const resolvedProperties = properties ?? DEFAULT_COMPANY_PROPERTIES;
    const params: Record<string, string | string[]> = {
      properties: resolvedProperties,
    };
    if (associations) params.associations = associations;

    return this.request<unknown>(`/crm/v3/objects/companies/${companyId}`, params);
  }
}
