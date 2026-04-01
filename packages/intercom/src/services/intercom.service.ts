import { TokenProvider } from "@vineethnkrishnan/oauth-core";
import { IntercomConfig } from "../common/types";

export class IntercomService {
  private baseUrl = "https://api.intercom.io";
  private tokenProvider: TokenProvider;

  constructor(config: IntercomConfig) {
    this.tokenProvider = config.tokenProvider;
  }

  // =========================================================================
  // GET request
  // =========================================================================

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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Intercom-Version": "2.11",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  // =========================================================================
  // POST request (search endpoints)
  // =========================================================================

  private async postRequest<T>(path: string, body: unknown): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Intercom-Version": "2.11",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  // =========================================================================
  // Error handling
  // =========================================================================

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorBody = await response.text().catch(() => "");

    switch (response.status) {
      case 401:
        throw new Error("Authentication failed. Check your INTERCOM_ACCESS_TOKEN.");
      case 403:
        throw new Error(
          "Access denied. Token may lack required scopes (read conversations, read contacts).",
        );
      case 404:
        throw new Error("Not found. Check the ID and ensure you have access.");
      case 429: {
        const retryAfter = response.headers.get("Retry-After") ?? "unknown";
        throw new Error(`Rate limited by Intercom. Retry after ${retryAfter} seconds.`);
      }
      default:
        throw new Error(
          `Intercom API error (${response.status}): ${errorBody || response.statusText}`,
        );
    }
  }

  // =========================================================================
  // Conversations
  // =========================================================================

  async listConversations(limit: number = 20): Promise<unknown> {
    return this.request<unknown>("/conversations", { per_page: limit });
  }

  async getConversation(conversationId: string): Promise<unknown> {
    return this.request<unknown>(`/conversations/${conversationId}`);
  }

  async searchConversations(query: string, limit: number = 20): Promise<unknown> {
    return this.postRequest<unknown>("/conversations/search", {
      query: {
        field: "source.body",
        operator: "~",
        value: query,
      },
      pagination: { per_page: limit },
    });
  }

  // =========================================================================
  // Contacts
  // =========================================================================

  async listContacts(limit: number = 50): Promise<unknown> {
    return this.request<unknown>("/contacts", { per_page: limit });
  }

  async getContact(contactId: string): Promise<unknown> {
    return this.request<unknown>(`/contacts/${contactId}`);
  }

  async searchContacts(query: string, limit: number = 50): Promise<unknown> {
    return this.postRequest<unknown>("/contacts/search", {
      query: {
        field: "email",
        operator: "~",
        value: query,
      },
      pagination: { per_page: limit },
    });
  }
}
