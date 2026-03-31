import { z } from "zod";
import { VercelService } from "../services/vercel.service";
import { formatMcpResponse } from "../common/utils";
import { stripAnsiCodes, truncateBuildLogs } from "../common/utils";
import { McpToolResponse } from "../common/types";

export const DeploymentToolSchemas = {
  list_deployments: {
    description:
      "Lists Vercel deployments. Optionally filter by project. Returns deployment status, URL, git commit info, and timestamps. Set VERCEL_TEAM_ID for team-scoped results.",
    schema: z.object({
      project_id: z.string().optional().describe("Filter deployments by project ID or name."),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of deployments to return (default 20, max 100)."),
    }),
  },
  get_deployment: {
    description:
      "Retrieves full details for a specific deployment including status, URL, git commit info, build timings, and error messages.",
    schema: z.object({
      deployment_id: z.string().describe("The deployment ID (e.g., 'dpl_abc123') or URL."),
    }),
  },
  get_deployment_build_logs: {
    description:
      "Retrieves build output logs for a deployment. Logs are cleaned (ANSI codes stripped) and truncated to the last 150 lines for LLM consumption. Errors typically appear at the end.",
    schema: z.object({
      deployment_id: z
        .string()
        .describe("The deployment ID (e.g., 'dpl_abc123') to fetch build logs for."),
    }),
  },
};

export class DeploymentTools {
  constructor(private vercelService: VercelService) {}

  async list_deployments(args: z.infer<typeof DeploymentToolSchemas.list_deployments.schema>) {
    const deployments = await this.vercelService.listDeployments(args.project_id, args.limit);
    return formatMcpResponse(deployments);
  }

  async get_deployment(args: z.infer<typeof DeploymentToolSchemas.get_deployment.schema>) {
    const deployment = await this.vercelService.getDeployment(args.deployment_id);
    return formatMcpResponse(deployment);
  }

  async get_deployment_build_logs(
    args: z.infer<typeof DeploymentToolSchemas.get_deployment_build_logs.schema>,
  ): Promise<McpToolResponse> {
    const events = (await this.vercelService.getDeploymentBuildLogs(args.deployment_id)) as Array<{
      type?: string;
      text?: string;
      payload?: { text?: string };
    }>;

    // Extract text from build events, strip ANSI codes, and truncate
    const logLines = events
      .filter((event) => event.text || event.payload?.text)
      .map((event) => {
        const text = event.text ?? event.payload?.text ?? "";
        return stripAnsiCodes(text);
      })
      .filter((line) => line.trim() !== "");

    const processedLogs = truncateBuildLogs(logLines);

    return {
      content: [{ type: "text", text: processedLogs }],
    };
  }
}
