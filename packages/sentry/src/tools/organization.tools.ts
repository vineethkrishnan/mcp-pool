import { z } from "zod";
import { SentryService } from "../services/sentry.service";
import { formatMcpResponse } from "../common/utils";

export const OrganizationToolSchemas = {
  list_organizations: {
    description:
      "Lists all Sentry organizations the current auth token has access to. Use this to discover available organizations before querying projects or issues.",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
  },
};

export class OrganizationTools {
  constructor(private sentryService: SentryService) {}

  async list_organizations() {
    const orgs = await this.sentryService.listOrganizations();
    return formatMcpResponse(orgs);
  }
}
