import { z } from "zod";
import { PagerDutyService } from "../services/pagerduty.service";
import { formatMcpResponse } from "../common/utils";

export const OncallToolSchemas = {
  list_oncalls: {
    description:
      "Lists who is currently on-call. Returns the on-call user, their escalation policy, escalation level, schedule, and time window. Use to answer 'who is on-call right now?' or 'who is on-call for a specific schedule?'. Filter by schedule IDs to narrow results.",
    schema: z.object({
      schedule_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by specific schedule IDs. Omit to return all on-call entries."),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Number of on-call entries to return (max 100)."),
    }),
  },
  get_schedule: {
    description:
      "Retrieves a specific on-call schedule including rotation details, current on-call user, overrides, and the rendered schedule. Use when you have a schedule ID and want to see the full rotation configuration.",
    schema: z.object({
      schedule_id: z.string().describe("The PagerDuty schedule ID (e.g., 'PSCH123')."),
    }),
  },
};

export class OncallTools {
  constructor(private pagerDutyService: PagerDutyService) {}

  async list_oncalls(args: z.infer<typeof OncallToolSchemas.list_oncalls.schema>) {
    const oncalls = await this.pagerDutyService.listOncalls(args.schedule_ids, args.limit);
    return formatMcpResponse(oncalls);
  }

  async get_schedule(args: z.infer<typeof OncallToolSchemas.get_schedule.schema>) {
    const schedule = await this.pagerDutyService.getSchedule(args.schedule_id);
    return formatMcpResponse(schedule);
  }
}
