import { z } from "zod";
import { VercelService } from "../services/vercel.service";
import { formatMcpResponse } from "../common/utils";

export const DeploymentWriteToolSchemas = {
  create_deployment: {
    description:
      "Creates a new Vercel deployment from a git source. Requires the project name/ID and git reference. Set VERCEL_TEAM_ID for team-scoped deployments.",
    schema: z.object({
      name: z.string().describe("The project name or ID to deploy."),
      git_source: z
        .object({
          type: z
            .string()
            .describe("The git provider type (e.g., 'github', 'gitlab', 'bitbucket')."),
          ref: z.string().describe("The git ref to deploy (branch, tag, or commit SHA)."),
          repo_id: z.string().describe("The repository ID on the git provider."),
        })
        .describe("Git source configuration for the deployment."),
    }),
    annotations: {
      title: "Create Deployment",
      idempotentHint: false,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  cancel_deployment: {
    description:
      "Cancels a running Vercel deployment. The deployment must be in a BUILDING or QUEUED state. This action cannot be undone.",
    schema: z.object({
      deployment_id: z.string().describe("The deployment ID (e.g., 'dpl_abc123') to cancel."),
    }),
    annotations: {
      title: "Cancel Deployment",
      idempotentHint: true,
      destructiveHint: true,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  promote_deployment: {
    description:
      "Promotes a deployment to production for the specified project. The deployment must be in a READY state.",
    schema: z.object({
      project_id: z.string().describe("The project ID or name (e.g., 'prj_abc123' or 'my-app')."),
      deployment_id: z.string().describe("The deployment ID (e.g., 'dpl_abc123') to promote."),
    }),
    annotations: {
      title: "Promote Deployment",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class DeploymentWriteTools {
  constructor(private vercelService: VercelService) {}

  async create_deployment(
    args: z.infer<typeof DeploymentWriteToolSchemas.create_deployment.schema>,
  ) {
    const deployment = await this.vercelService.createDeployment(args.name, {
      type: args.git_source.type,
      ref: args.git_source.ref,
      repoId: args.git_source.repo_id,
    });
    return formatMcpResponse(deployment, `Deployment created for project "${args.name}".`);
  }

  async cancel_deployment(
    args: z.infer<typeof DeploymentWriteToolSchemas.cancel_deployment.schema>,
  ) {
    const result = await this.vercelService.cancelDeployment(args.deployment_id);
    return formatMcpResponse(result, `Deployment ${args.deployment_id} cancelled successfully.`);
  }

  async promote_deployment(
    args: z.infer<typeof DeploymentWriteToolSchemas.promote_deployment.schema>,
  ) {
    const result = await this.vercelService.promoteDeployment(args.project_id, args.deployment_id);
    return formatMcpResponse(
      result,
      `Deployment ${args.deployment_id} promoted to production for project ${args.project_id}.`,
    );
  }
}
