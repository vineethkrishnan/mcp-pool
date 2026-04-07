import { z } from "zod";
import { SentryService } from "../services/sentry.service";
import { formatMcpResponse } from "../common/utils";

export const IssueToolSchemas = {
  get_issue: {
    description:
      "Retrieves full details for a specific Sentry issue including title, culprit, status, first/last seen, event count, and assigned user. Use when you have a specific issue ID.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID (numeric, e.g., '12345')."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_issues: {
    description:
      "Lists issues for a specific project. Supports Sentry search syntax in the query parameter (e.g., 'is:unresolved', 'assigned:me', 'level:error'). Use this for project-scoped issue listing.",
    schema: z.object({
      project: z.string().describe("The project slug (e.g., 'my-frontend')."),
      org: z.string().optional().describe("Organization slug. Uses SENTRY_ORG if not specified."),
      query: z
        .string()
        .optional()
        .describe("Sentry search query (e.g., 'is:unresolved level:error')."),
      sort: z
        .enum(["date", "new", "priority", "freq", "user"])
        .optional()
        .describe("Sort order for results."),
      limit: z.number().optional().default(25).describe("Number of issues to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_issues: {
    description:
      "Searches issues across ALL projects in an organization using Sentry's full-text search. Use this when you don't know which project an issue is in, or want org-wide results.",
    schema: z.object({
      query: z.string().describe("Search query (e.g., 'TypeError', 'is:unresolved assigned:me')."),
      org: z.string().optional().describe("Organization slug. Uses SENTRY_ORG if not specified."),
      limit: z.number().optional().default(25).describe("Number of issues to return (max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class IssueTools {
  constructor(private sentryService: SentryService) {}

  async get_issue(args: z.infer<typeof IssueToolSchemas.get_issue.schema>) {
    const issue = await this.sentryService.getIssue(args.issue_id);
    return formatMcpResponse(issue);
  }

  async list_issues(args: z.infer<typeof IssueToolSchemas.list_issues.schema>) {
    const issues = await this.sentryService.listIssues(
      args.project,
      args.org,
      args.query,
      args.sort,
      args.limit,
    );
    return formatMcpResponse(issues);
  }

  async search_issues(args: z.infer<typeof IssueToolSchemas.search_issues.schema>) {
    const issues = await this.sentryService.searchIssues(args.query, args.org, args.limit);
    return formatMcpResponse(issues);
  }
}
