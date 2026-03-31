import { VercelConfig } from "../common/types";

export class VercelService {
  private baseUrl = "https://api.vercel.com";
  private token: string;
  private teamId?: string;

  constructor(config: VercelConfig) {
    this.token = config.token;
    this.teamId = config.teamId;
  }

  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(path, this.baseUrl);
    if (this.teamId) {
      url.searchParams.set("teamId", this.teamId);
    }
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your VERCEL_TOKEN.");
        case 403:
          throw new Error(
            "Access denied. Token may lack required scopes, or you may not have access to this team.",
          );
        case 404:
          throw new Error("Not found. Check the ID and ensure you have access.");
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Vercel. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Vercel API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Projects
  // ===========================================================================

  async listProjects(limit: number = 20): Promise<unknown> {
    return this.request<unknown>("/v9/projects", { limit });
  }

  async getProject(projectId: string): Promise<unknown> {
    return this.request<unknown>(`/v9/projects/${projectId}`);
  }

  // ===========================================================================
  // Deployments
  // ===========================================================================

  async listDeployments(projectId?: string, limit: number = 20): Promise<unknown> {
    const params: Record<string, string | number> = { limit };
    if (projectId) {
      params.projectId = projectId;
    }
    return this.request<unknown>("/v6/deployments", params);
  }

  async getDeployment(deploymentId: string): Promise<unknown> {
    return this.request<unknown>(`/v13/deployments/${deploymentId}`);
  }

  async getDeploymentBuildLogs(deploymentId: string): Promise<unknown> {
    return this.request<unknown>(`/v2/deployments/${deploymentId}/events`);
  }
}
