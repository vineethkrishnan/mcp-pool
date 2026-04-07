import { z } from "zod";
import { LinearService } from "../services/linear.service";
import { formatMcpResponse } from "../common/utils";

export const IssueWriteToolSchemas = {
  create_issue: {
    description: "Create a new Linear issue with title, description, and optional assignee.",
    schema: z.object({
      team_id: z.string().describe("The team ID to create the issue in."),
      title: z.string().describe("Issue title."),
      description: z.string().optional().describe("Issue description (Markdown supported)."),
      assignee_id: z.string().optional().describe("User ID to assign the issue to."),
      priority: z
        .number()
        .min(0)
        .max(4)
        .optional()
        .describe("Priority: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low."),
      state_id: z.string().optional().describe("Workflow state ID."),
    }),
    annotations: {
      title: "Create Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  update_issue_status: {
    description: "Change the workflow state of a Linear issue.",
    schema: z.object({
      issue_id: z.string().describe("The issue ID (e.g., 'abc-123' identifier or UUID)."),
      state_id: z.string().describe("The target workflow state ID."),
    }),
    annotations: {
      title: "Update Issue Status",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  assign_issue: {
    description: "Assign or reassign a Linear issue to a user.",
    schema: z.object({
      issue_id: z.string().describe("The issue ID."),
      assignee_id: z.string().describe("User ID to assign to."),
    }),
    annotations: {
      title: "Assign Issue",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  add_issue_comment: {
    description: "Add a comment to a Linear issue.",
    schema: z.object({
      issue_id: z.string().describe("The issue ID."),
      body: z.string().describe("Comment body (Markdown supported)."),
    }),
    annotations: {
      title: "Add Comment",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  create_project: {
    description: "Create a new Linear project.",
    schema: z.object({
      name: z.string().describe("Project name."),
      team_ids: z.array(z.string()).describe("Array of team IDs to associate with the project."),
      description: z.string().optional().describe("Project description."),
    }),
    annotations: {
      title: "Create Project",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
};

export class IssueWriteTools {
  constructor(private linearService: LinearService) {}

  async create_issue(args: z.infer<typeof IssueWriteToolSchemas.create_issue.schema>) {
    const result = await this.linearService.createIssue(
      args.team_id,
      args.title,
      args.description,
      args.assignee_id,
      args.priority,
      args.state_id,
    );
    return formatMcpResponse(result, `Issue created: ${args.title}`);
  }

  async update_issue_status(
    args: z.infer<typeof IssueWriteToolSchemas.update_issue_status.schema>,
  ) {
    const result = await this.linearService.updateIssueStatus(args.issue_id, args.state_id);
    return formatMcpResponse(result, `Issue ${args.issue_id} status updated`);
  }

  async assign_issue(args: z.infer<typeof IssueWriteToolSchemas.assign_issue.schema>) {
    const result = await this.linearService.assignIssue(args.issue_id, args.assignee_id);
    return formatMcpResponse(result, `Issue ${args.issue_id} assigned`);
  }

  async add_issue_comment(args: z.infer<typeof IssueWriteToolSchemas.add_issue_comment.schema>) {
    const result = await this.linearService.addIssueComment(args.issue_id, args.body);
    return formatMcpResponse(result, `Comment added to ${args.issue_id}`);
  }

  async create_project(args: z.infer<typeof IssueWriteToolSchemas.create_project.schema>) {
    const result = await this.linearService.createProject(
      args.team_ids,
      args.name,
      args.description,
    );
    return formatMcpResponse(result, `Project created: ${args.name}`);
  }
}
