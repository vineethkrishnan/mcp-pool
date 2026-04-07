import { z } from "zod";
import { LinearService } from "../services/linear.service";
import { formatMcpResponse } from "../common/utils";

export const IssueToolSchemas = {
  list_issues: {
    description:
      "Lists issues from Linear, optionally filtered by team and status. Returns issue title, identifier, priority, state, assignee, and labels.",
    schema: z.object({
      team_id: z.string().optional().describe("Team ID to filter issues by."),
      status: z
        .string()
        .optional()
        .describe("Workflow state name to filter by (e.g., 'In Progress', 'Done')."),
      limit: z.number().optional().default(25).describe("Number of issues to return (max 50)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_issue: {
    description:
      "Retrieves full details for a specific Linear issue including title, description, state, priority, assignee, labels, and timestamps. Accepts both UUID and human-readable identifier (e.g., 'ENG-123').",
    schema: z.object({
      issue_id: z.string().describe("The issue ID (UUID) or identifier (e.g., 'ENG-123')."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_issues: {
    description:
      "Searches Linear issues by text query across all teams. Returns matching issues with title, identifier, priority, state, and assignee.",
    schema: z.object({
      query: z.string().describe("Search query to find issues by title or description."),
      limit: z.number().optional().default(25).describe("Number of issues to return (max 50)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class IssueTools {
  constructor(private linearService: LinearService) {}

  async list_issues(args: z.infer<typeof IssueToolSchemas.list_issues.schema>) {
    const issues = await this.linearService.listIssues(args.team_id, args.status, args.limit);
    return formatMcpResponse(issues);
  }

  async get_issue(args: z.infer<typeof IssueToolSchemas.get_issue.schema>) {
    const issue = await this.linearService.getIssue(args.issue_id);
    return formatMcpResponse(issue);
  }

  async search_issues(args: z.infer<typeof IssueToolSchemas.search_issues.schema>) {
    const issues = await this.linearService.searchIssues(args.query, args.limit);
    return formatMcpResponse(issues);
  }
}
