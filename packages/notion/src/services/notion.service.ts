import { TokenProvider } from "@vineethnkrishnan/oauth-core";
import { NotionConfig } from "../common/types";

export class NotionService {
  private baseUrl: string;
  private tokenProvider: TokenProvider;
  private notionVersion: string;

  constructor(config: NotionConfig) {
    this.baseUrl = "https://api.notion.com/v1";
    this.tokenProvider = config.tokenProvider;
    this.notionVersion = config.notionVersion;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": this.notionVersion,
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your NOTION_API_KEY.");
        case 403:
          throw new Error(
            "Access denied. Ensure the Notion integration is connected to this page/database via the 'Connect to' menu.",
          );
        case 404:
          throw new Error(
            "Not found. The page/database may not exist or may not be shared with your integration.",
          );
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Notion. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Notion API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  async search(
    query?: string,
    filter?: { property: "object"; value: "page" | "database" },
    limit: number = 10,
  ): Promise<unknown> {
    const body: Record<string, unknown> = { page_size: Math.min(limit, 100) };
    if (query) body.query = query;
    if (filter) body.filter = filter;
    return this.request<unknown>("POST", "/search", body);
  }

  // ===========================================================================
  // Pages
  // ===========================================================================

  async getPage(pageId: string): Promise<unknown> {
    return this.request<unknown>("GET", `/pages/${pageId}`);
  }

  async getPageContent(
    blockId: string,
    maxDepth: number = 3,
    maxBlocks: number = 100,
  ): Promise<unknown[]> {
    const allBlocks: unknown[] = [];

    const fetchChildren = async (parentId: string, depth: number): Promise<void> => {
      if (depth > maxDepth || allBlocks.length >= maxBlocks) return;

      const result = await this.request<{
        results: Record<string, unknown>[];
        has_more: boolean;
      }>("GET", `/blocks/${parentId}/children?page_size=100`);

      for (const block of result.results) {
        if (allBlocks.length >= maxBlocks) break;
        allBlocks.push({ ...block, _depth: depth });

        if (block.has_children === true) {
          await fetchChildren(block.id as string, depth + 1);
        }
      }
    };

    await fetchChildren(blockId, 0);
    return allBlocks;
  }

  // ===========================================================================
  // Page write operations
  // ===========================================================================

  async createPage(
    parent: { database_id?: string; page_id?: string },
    properties: Record<string, unknown>,
    children?: unknown[],
  ): Promise<unknown> {
    const body: Record<string, unknown> = { parent, properties };
    if (children) body.children = children;
    return this.request<unknown>("POST", "/pages", body);
  }

  async updatePageProperties(
    pageId: string,
    properties: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request<unknown>("PATCH", `/pages/${pageId}`, { properties });
  }

  async archivePage(pageId: string): Promise<unknown> {
    return this.request<unknown>("PATCH", `/pages/${pageId}`, { archived: true });
  }

  // ===========================================================================
  // Block write operations
  // ===========================================================================

  async appendBlocks(blockId: string, children: unknown[]): Promise<unknown> {
    return this.request<unknown>("PATCH", `/blocks/${blockId}/children`, { children });
  }

  // ===========================================================================
  // Databases
  // ===========================================================================

  async getDatabase(databaseId: string): Promise<unknown> {
    return this.request<unknown>("GET", `/databases/${databaseId}`);
  }

  async queryDatabase(
    databaseId: string,
    filter?: unknown,
    sorts?: unknown,
    limit: number = 25,
  ): Promise<unknown> {
    const body: Record<string, unknown> = { page_size: Math.min(limit, 100) };
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;
    return this.request<unknown>("POST", `/databases/${databaseId}/query`, body);
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async listUsers(limit: number = 25): Promise<unknown> {
    return this.request<unknown>("GET", `/users?page_size=${Math.min(limit, 100)}`);
  }
}
