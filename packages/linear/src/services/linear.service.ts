import { TokenProvider } from "@vineethnkrishnan/oauth-core";
import { LinearConfig } from "../common/types";

const GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";

// ===========================================================================
// GraphQL query fragments
// ===========================================================================

const ISSUE_FIELDS = `
  id
  identifier
  title
  description
  priority
  state { name type }
  assignee { name email }
  team { name key }
  labels { nodes { name } }
  createdAt
  updatedAt
  url
`;

const PROJECT_FIELDS = `
  id
  name
  description
  state
  progress
  startDate
  targetDate
  teams { nodes { name } }
  lead { name }
  url
`;

const TEAM_FIELDS = `
  id
  name
  key
  description
  members { nodes { name email } }
`;

// ===========================================================================
// Service
// ===========================================================================

export class LinearService {
  private tokenProvider: TokenProvider;

  constructor(config: LinearConfig) {
    this.tokenProvider = config.tokenProvider;
  }

  async query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
    const token = await this.tokenProvider.getAccessToken();
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    // Handle HTTP-level errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Authentication failed. Check your LINEAR_API_KEY.");
        case 429: {
          const retryAfter = response.headers.get("Retry-After") ?? "unknown";
          throw new Error(`Rate limited by Linear. Retry after ${retryAfter} seconds.`);
        }
        default:
          throw new Error(
            `Linear API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
    };

    // Handle GraphQL-level errors
    if (json.errors && json.errors.length > 0) {
      const messages = json.errors.map((e) => e.message).join("; ");
      throw new Error(`Linear GraphQL error: ${messages}`);
    }

    if (!json.data) {
      throw new Error("Linear API returned no data.");
    }

    return json.data;
  }

  // ===========================================================================
  // Issues
  // ===========================================================================

  async listIssues(teamId?: string, status?: string, limit: number = 25): Promise<unknown> {
    const filterParts: string[] = [];
    if (teamId) filterParts.push(`team: { id: { eq: "${teamId}" } }`);
    if (status) filterParts.push(`state: { name: { eqCaseInsensitive: "${status}" } }`);

    const filterArg = filterParts.length > 0 ? `, filter: { ${filterParts.join(", ")} }` : "";

    const graphqlQuery = `
      query ListIssues {
        issues(first: ${limit}${filterArg}) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    `;

    const data = await this.query<{ issues: unknown }>(graphqlQuery);
    return data.issues;
  }

  async getIssue(issueId: string): Promise<unknown> {
    const graphqlQuery = `
      query GetIssue($id: String!) {
        issue(id: $id) { ${ISSUE_FIELDS} }
      }
    `;

    const data = await this.query<{ issue: unknown }>(graphqlQuery, { id: issueId });
    return data.issue;
  }

  async searchIssues(searchQuery: string, limit: number = 25): Promise<unknown> {
    const graphqlQuery = `
      query SearchIssues($query: String!, $first: Int) {
        searchIssues(query: $query, first: $first) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    `;

    const data = await this.query<{ searchIssues: unknown }>(graphqlQuery, {
      query: searchQuery,
      first: limit,
    });
    return data.searchIssues;
  }

  // ===========================================================================
  // Projects
  // ===========================================================================

  async listProjects(limit: number = 25): Promise<unknown> {
    const graphqlQuery = `
      query ListProjects($first: Int) {
        projects(first: $first) {
          nodes { ${PROJECT_FIELDS} }
        }
      }
    `;

    const data = await this.query<{ projects: unknown }>(graphqlQuery, { first: limit });
    return data.projects;
  }

  async getProject(projectId: string): Promise<unknown> {
    const graphqlQuery = `
      query GetProject($id: String!) {
        project(id: $id) { ${PROJECT_FIELDS} }
      }
    `;

    const data = await this.query<{ project: unknown }>(graphqlQuery, { id: projectId });
    return data.project;
  }

  // ===========================================================================
  // Teams
  // ===========================================================================

  async listTeams(limit: number = 25): Promise<unknown> {
    const graphqlQuery = `
      query ListTeams($first: Int) {
        teams(first: $first) {
          nodes { ${TEAM_FIELDS} }
        }
      }
    `;

    const data = await this.query<{ teams: unknown }>(graphqlQuery, { first: limit });
    return data.teams;
  }
}
