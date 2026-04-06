import { z } from "zod";
import { DatadogService } from "../services/datadog.service";
import { formatMcpResponse } from "../common/utils";

export const MonitorWriteToolSchemas = {
  mute_monitor: {
    description:
      "Mutes a Datadog monitor. Optionally specify an end timestamp (POSIX) and scope to limit the mute. Returns the muted monitor state.",
    schema: z.object({
      monitor_id: z.string().describe("The Datadog monitor ID."),
      end: z
        .number()
        .optional()
        .describe("POSIX timestamp for when the mute should end. Omit for indefinite mute."),
      scope: z
        .string()
        .optional()
        .describe("Scope to mute (e.g., 'host:myhost'). Omit to mute all scopes."),
    }),
    annotations: {
      title: "Mute Monitor",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  unmute_monitor: {
    description:
      "Unmutes a previously muted Datadog monitor. Optionally specify a scope to unmute. Returns the unmuted monitor state.",
    schema: z.object({
      monitor_id: z.string().describe("The Datadog monitor ID."),
      scope: z
        .string()
        .optional()
        .describe("Scope to unmute (e.g., 'host:myhost'). Omit to unmute all scopes."),
    }),
    annotations: {
      title: "Unmute Monitor",
      idempotentHint: true,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
  create_downtime: {
    description:
      "Creates a scheduled downtime in Datadog. Downtimes silence monitor notifications for the specified scope and time window.",
    schema: z.object({
      scope: z
        .string()
        .describe("The scope to apply the downtime to (e.g., 'env:staging', 'host:myhost')."),
      start: z
        .number()
        .optional()
        .describe("POSIX timestamp for downtime start. Defaults to now if omitted."),
      end: z
        .number()
        .optional()
        .describe("POSIX timestamp for downtime end. Omit for indefinite downtime."),
      message: z.string().optional().describe("A message to include with the downtime."),
      monitor_id: z
        .number()
        .optional()
        .describe("Specific monitor ID to downtime. Omit to apply to all matching monitors."),
    }),
    annotations: {
      title: "Create Downtime",
      idempotentHint: false,
      destructiveHint: false,
      readOnlyHint: false,
      openWorldHint: true,
    },
  },
};

export class MonitorWriteTools {
  constructor(private datadogService: DatadogService) {}

  async mute_monitor(args: z.infer<typeof MonitorWriteToolSchemas.mute_monitor.schema>) {
    const result = await this.datadogService.muteMonitor(args.monitor_id, args.end, args.scope);
    return formatMcpResponse(result, undefined, `Monitor ${args.monitor_id} muted successfully.`);
  }

  async unmute_monitor(args: z.infer<typeof MonitorWriteToolSchemas.unmute_monitor.schema>) {
    const result = await this.datadogService.unmuteMonitor(args.monitor_id, args.scope);
    return formatMcpResponse(result, undefined, `Monitor ${args.monitor_id} unmuted successfully.`);
  }

  async create_downtime(args: z.infer<typeof MonitorWriteToolSchemas.create_downtime.schema>) {
    const result = await this.datadogService.createDowntime(
      args.scope,
      args.start,
      args.end,
      args.message,
      args.monitor_id,
    );
    return formatMcpResponse(
      result,
      undefined,
      `Downtime created for scope "${args.scope}" successfully.`,
    );
  }
}
