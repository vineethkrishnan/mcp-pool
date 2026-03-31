import { z } from "zod";
import { NotionService } from "../services/notion.service";
import { formatMcpResponse } from "../common/utils";

export const UserToolSchemas = {
  list_users: {
    description:
      "Lists all users in the Notion workspace including name, email, type (person/bot), and avatar URL.",
    schema: z.object({
      limit: z.number().optional().default(25).describe("Max results (max 100)."),
    }),
  },
};

export class UserTools {
  constructor(private notionService: NotionService) {}

  async list_users(args: z.infer<typeof UserToolSchemas.list_users.schema>) {
    const users = await this.notionService.listUsers(args.limit);
    return formatMcpResponse(users);
  }
}
