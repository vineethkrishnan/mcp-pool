import { SentryConfig } from "../common/types";

export class SentryService {
  private baseApiUrl: string;
  private authToken: string;
  private defaultOrg?: string;

  constructor(config: SentryConfig) {
    // Normalize baseUrl: remove trailing slash, append /api/0
    const base = config.baseUrl.replace(/\/+$/, "");
    this.baseApiUrl = `${base}/api/0`;
    this.authToken = config.authToken;
    this.defaultOrg = config.org;
  }

  private resolveOrg(org?: string): string {
    const resolved = org ?? this.defaultOrg;
    if (!resolved) {
      throw new Error(
        "Organization is required. Set SENTRY_ORG environment variable or pass the org parameter.",
      );
    }
    return resolved;
  }

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseApiUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your SENTRY_AUTH_TOKEN.");
        case 403:
          throw new Error(
            "Access denied. Token may lack required scopes (org:read, project:read, event:read).",
          );
        case 404:
          throw new Error("Not found. Check the ID and ensure you have access.");
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Sentry. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Sentry API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  private async mutateRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseApiUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your SENTRY_AUTH_TOKEN.");
        case 403:
          throw new Error(
            "Access denied. Token may lack required scopes (org:read, project:read, event:read).",
          );
        case 404:
          throw new Error("Not found. Check the ID and ensure you have access.");
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Sentry. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Sentry API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // Organizations
  async listOrganizations(): Promise<unknown[]> {
    return this.request<unknown[]>("/organizations/");
  }

  // Projects
  async listProjects(org?: string): Promise<unknown[]> {
    const resolvedOrg = this.resolveOrg(org);
    return this.request<unknown[]>(`/organizations/${resolvedOrg}/projects/`);
  }

  // Issues
  async getIssue(issueId: string): Promise<unknown> {
    return this.request<unknown>(`/issues/${issueId}/`);
  }

  async listIssues(
    project: string,
    org?: string,
    query?: string,
    sort?: string,
    limit: number = 25,
  ): Promise<unknown[]> {
    const resolvedOrg = this.resolveOrg(org);
    const params: Record<string, string | number> = { per_page: limit };
    if (query) params.query = query;
    if (sort) params.sort = sort;
    return this.request<unknown[]>(`/projects/${resolvedOrg}/${project}/issues/`, params);
  }

  async searchIssues(query: string, org?: string, limit: number = 25): Promise<unknown[]> {
    const resolvedOrg = this.resolveOrg(org);
    return this.request<unknown[]>(`/organizations/${resolvedOrg}/issues/`, {
      query,
      per_page: limit,
    });
  }

  // Events
  async getEvent(eventId: string, project: string, org?: string): Promise<unknown> {
    const resolvedOrg = this.resolveOrg(org);
    return this.request<unknown>(`/projects/${resolvedOrg}/${project}/events/${eventId}/`);
  }

  async listIssueEvents(issueId: string, limit: number = 25): Promise<unknown[]> {
    return this.request<unknown[]>(`/issues/${issueId}/events/`, {
      per_page: limit,
    });
  }

  async getLatestEvent(issueId: string): Promise<unknown> {
    return this.request<unknown>(`/issues/${issueId}/events/latest/`);
  }

  // Issue mutations
  async resolveIssue(issueId: string): Promise<unknown> {
    return this.mutateRequest<unknown>("PUT", `/issues/${issueId}/`, { status: "resolved" });
  }

  async unresolveIssue(issueId: string): Promise<unknown> {
    return this.mutateRequest<unknown>("PUT", `/issues/${issueId}/`, { status: "unresolved" });
  }

  async ignoreIssue(
    issueId: string,
    ignoreDuration?: number,
    ignoreCount?: number,
    ignoreWindow?: number,
  ): Promise<unknown> {
    const body: Record<string, unknown> = { status: "ignored" };
    if (ignoreDuration || ignoreCount || ignoreWindow) {
      body.statusDetails = {};
      if (ignoreDuration)
        (body.statusDetails as Record<string, unknown>).ignoreDuration = ignoreDuration;
      if (ignoreCount) (body.statusDetails as Record<string, unknown>).ignoreCount = ignoreCount;
      if (ignoreWindow) (body.statusDetails as Record<string, unknown>).ignoreWindow = ignoreWindow;
    }
    return this.mutateRequest<unknown>("PUT", `/issues/${issueId}/`, body);
  }

  async assignIssue(issueId: string, assignee: string): Promise<unknown> {
    return this.mutateRequest<unknown>("PUT", `/issues/${issueId}/`, { assignedTo: assignee });
  }

  async mergeIssues(issueId: string, issueIds: string[]): Promise<unknown> {
    return this.mutateRequest<unknown>("PUT", `/issues/${issueId}/`, {
      merge: 1,
      id: issueIds,
    });
  }
}
