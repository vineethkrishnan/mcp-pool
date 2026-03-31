import { z } from "zod";
import { SentryService } from "../services/sentry.service";
import { formatMcpResponse } from "../common/utils";

export const ProjectToolSchemas = {
  list_projects: {
    description:
      "Lists all projects in a Sentry organization. Use this to find project slugs needed for issue queries.",
    schema: z.object({
      org: z.string().optional().describe("Organization slug. Uses SENTRY_ORG if not specified."),
    }),
  },
};

export class ProjectTools {
  constructor(private sentryService: SentryService) {}

  async list_projects(args: z.infer<typeof ProjectToolSchemas.list_projects.schema>) {
    const projects = await this.sentryService.listProjects(args.org);
    return formatMcpResponse(projects);
  }
}
