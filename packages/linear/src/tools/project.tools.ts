import { z } from "zod";
import { LinearService } from "../services/linear.service";
import { formatMcpResponse } from "../common/utils";

export const ProjectToolSchemas = {
  list_projects: {
    description:
      "Lists all projects in the Linear workspace. Returns project name, state, progress percentage, lead, start/target dates, and associated teams.",
    schema: z.object({
      limit: z.number().optional().default(25).describe("Number of projects to return (max 50)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_project: {
    description:
      "Retrieves full details for a specific Linear project including name, description, state, progress, lead, start/target dates, and associated teams.",
    schema: z.object({
      project_id: z.string().describe("The project ID (UUID)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class ProjectTools {
  constructor(private linearService: LinearService) {}

  async list_projects(args: z.infer<typeof ProjectToolSchemas.list_projects.schema>) {
    const projects = await this.linearService.listProjects(args.limit);
    return formatMcpResponse(projects);
  }

  async get_project(args: z.infer<typeof ProjectToolSchemas.get_project.schema>) {
    const project = await this.linearService.getProject(args.project_id);
    return formatMcpResponse(project);
  }
}
