import { z } from "zod";
import { LinearService } from "../services/linear.service";
import { formatMcpResponse } from "../common/utils";

export const TeamToolSchemas = {
  list_teams: {
    description:
      "Lists all teams in the Linear workspace including name, key (prefix for issue identifiers), description, and members.",
    schema: z.object({
      limit: z.number().optional().default(25).describe("Number of teams to return (max 50)."),
    }),
  },
};

export class TeamTools {
  constructor(private linearService: LinearService) {}

  async list_teams(args: z.infer<typeof TeamToolSchemas.list_teams.schema>) {
    const teams = await this.linearService.listTeams(args.limit);
    return formatMcpResponse(teams);
  }
}
