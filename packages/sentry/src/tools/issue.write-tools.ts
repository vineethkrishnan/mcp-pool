import { z } from "zod";
import { SentryService } from "../services/sentry.service";
import { formatMcpResponse } from "../common/utils";

export const IssueWriteToolSchemas = {
  resolve_issue: {
    description: "Resolve a Sentry issue, marking it as fixed.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID (e.g., '12345')."),
    }),
    annotations: {
      title: "Resolve Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  unresolve_issue: {
    description: "Reopen a resolved Sentry issue, marking it as unresolved.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID."),
    }),
    annotations: {
      title: "Unresolve Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  ignore_issue: {
    description: "Ignore a Sentry issue. Optionally set conditions for when to stop ignoring.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID."),
      ignore_duration: z.number().optional().describe("Minutes to ignore (e.g., 30, 60, 1440)."),
      ignore_count: z.number().optional().describe("Ignore until seen this many more times."),
      ignore_window: z.number().optional().describe("Time window in minutes for ignore_count."),
    }),
    annotations: {
      title: "Ignore Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  assign_issue: {
    description: "Assign a Sentry issue to a user or team.",
    schema: z.object({
      issue_id: z.string().describe("The Sentry issue ID."),
      assignee: z.string().describe("Username, email, or 'team:slug' to assign to."),
    }),
    annotations: {
      title: "Assign Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  merge_issues: {
    description: "Merge duplicate Sentry issues into one.",
    schema: z.object({
      issue_id: z.string().describe("The primary issue ID to merge into."),
      issue_ids: z
        .array(z.string())
        .describe("Array of issue IDs to merge into the primary issue."),
    }),
    annotations: {
      title: "Merge Issues",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  },
};

export class IssueWriteTools {
  constructor(private sentryService: SentryService) {}

  async resolve_issue(args: z.infer<typeof IssueWriteToolSchemas.resolve_issue.schema>) {
    const issue = await this.sentryService.resolveIssue(args.issue_id);
    return formatMcpResponse(issue, `Issue ${args.issue_id} resolved`);
  }

  async unresolve_issue(args: z.infer<typeof IssueWriteToolSchemas.unresolve_issue.schema>) {
    const issue = await this.sentryService.unresolveIssue(args.issue_id);
    return formatMcpResponse(issue, `Issue ${args.issue_id} reopened`);
  }

  async ignore_issue(args: z.infer<typeof IssueWriteToolSchemas.ignore_issue.schema>) {
    const issue = await this.sentryService.ignoreIssue(
      args.issue_id,
      args.ignore_duration,
      args.ignore_count,
      args.ignore_window,
    );
    return formatMcpResponse(issue, `Issue ${args.issue_id} ignored`);
  }

  async assign_issue(args: z.infer<typeof IssueWriteToolSchemas.assign_issue.schema>) {
    const issue = await this.sentryService.assignIssue(args.issue_id, args.assignee);
    return formatMcpResponse(issue, `Issue ${args.issue_id} assigned to ${args.assignee}`);
  }

  async merge_issues(args: z.infer<typeof IssueWriteToolSchemas.merge_issues.schema>) {
    const result = await this.sentryService.mergeIssues(args.issue_id, args.issue_ids);
    return formatMcpResponse(result, `Issues merged into ${args.issue_id}`);
  }
}
