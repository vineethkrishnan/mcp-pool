import { z } from "zod";
import { VercelService } from "../services/vercel.service";
import { formatMcpResponse } from "../common/utils";

export const ProjectToolSchemas = {
  list_projects: {
    description:
      "Lists all Vercel projects. Returns project names, frameworks, and latest deployment info. Set VERCEL_TEAM_ID for team-scoped results.",
    schema: z.object({
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of projects to return (default 20, max 100)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_project: {
    description:
      "Retrieves full details for a specific Vercel project including framework, build settings, git repository link, and latest deployment info.",
    schema: z.object({
      project_id: z.string().describe("The project ID or name (e.g., 'prj_abc123' or 'my-app')."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class ProjectTools {
  constructor(private vercelService: VercelService) {}

  async list_projects(args: z.infer<typeof ProjectToolSchemas.list_projects.schema>) {
    const projects = await this.vercelService.listProjects(args.limit);
    return formatMcpResponse(projects);
  }

  async get_project(args: z.infer<typeof ProjectToolSchemas.get_project.schema>) {
    const project = await this.vercelService.getProject(args.project_id);
    return formatMcpResponse(project);
  }
}
