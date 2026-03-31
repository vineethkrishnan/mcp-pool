import { GoogleAuthService } from "./auth.service";
import { GmailMessage } from "../common/types";
import { extractEmailBody, simplifyEmailHeaders } from "../common/utils";

export class GmailService {
  private baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me";

  constructor(private auth: GoogleAuthService) {}

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.auth.getAccessToken();
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
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Gmail authentication failed. Your access token may be expired.");
        case 403:
          throw new Error("Gmail access denied. Token may lack the gmail.readonly scope.");
        case 404:
          throw new Error("Gmail resource not found. Check the message ID.");
        case 429:
          throw new Error("Gmail API rate limit exceeded. Try again later.");
        default:
          throw new Error(
            `Gmail API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  async listMessages(query?: string, maxResults: number = 10): Promise<unknown> {
    const params: Record<string, string | number> = { maxResults };
    if (query) params.q = query;

    const data = await this.request<{
      messages?: Array<{ id: string; threadId: string }>;
      resultSizeEstimate?: number;
    }>("/messages", params);

    if (!data.messages || data.messages.length === 0) {
      return { messages: [], resultSizeEstimate: 0 };
    }

    // Fetch snippet for each message via minimal format
    const messages = await Promise.all(
      data.messages.map(async (msg) => {
        const detail = await this.request<GmailMessage>(`/messages/${msg.id}`, {
          format: "metadata",
          metadataHeaders: "From,To,Subject,Date",
        } as Record<string, string>);
        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet ?? "",
          headers: simplifyEmailHeaders(detail.payload?.headers),
        };
      }),
    );

    return { messages, resultSizeEstimate: data.resultSizeEstimate ?? messages.length };
  }

  async getMessage(messageId: string): Promise<unknown> {
    const message = await this.request<GmailMessage>(`/messages/${messageId}`, {
      format: "full",
    });

    const headers = simplifyEmailHeaders(message.payload?.headers);
    const body = extractEmailBody(message.payload);

    return {
      id: message.id,
      threadId: message.threadId,
      labelIds: message.labelIds ?? [],
      headers,
      body,
      snippet: message.snippet ?? "",
    };
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<unknown> {
    return this.listMessages(query, maxResults);
  }
}
