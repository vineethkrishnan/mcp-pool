import { z } from "zod";
import { PagerDutyService } from "../services/pagerduty.service";
import { formatMcpResponse } from "../common/utils";

const DEFAULT_EMAIL = process.env.PAGERDUTY_USER_EMAIL;

export const IncidentWriteToolSchemas = {
  acknowledge_incident: {
    description: "Acknowledge a triggered PagerDuty incident.",
    schema: z.object({
      incident_id: z.string().describe("The incident ID."),
      from_email: z
        .string()
        .optional()
        .describe(
          "Email of the user performing the action. Uses PAGERDUTY_USER_EMAIL if not specified.",
        ),
    }),
    annotations: {
      title: "Acknowledge Incident",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  resolve_incident: {
    description: "Resolve a PagerDuty incident.",
    schema: z.object({
      incident_id: z.string().describe("The incident ID."),
      from_email: z
        .string()
        .optional()
        .describe("Email of the user. Uses PAGERDUTY_USER_EMAIL if not specified."),
    }),
    annotations: {
      title: "Resolve Incident",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  reassign_incident: {
    description: "Reassign a PagerDuty incident to different users.",
    schema: z.object({
      incident_id: z.string().describe("The incident ID."),
      user_ids: z.array(z.string()).describe("Array of user IDs to assign to."),
      from_email: z
        .string()
        .optional()
        .describe("Email of the user. Uses PAGERDUTY_USER_EMAIL if not specified."),
    }),
    annotations: {
      title: "Reassign Incident",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  add_incident_note: {
    description: "Add a note to a PagerDuty incident timeline.",
    schema: z.object({
      incident_id: z.string().describe("The incident ID."),
      content: z.string().describe("Note content."),
      from_email: z
        .string()
        .optional()
        .describe("Email of the user. Uses PAGERDUTY_USER_EMAIL if not specified."),
    }),
    annotations: {
      title: "Add Incident Note",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
};

function resolveEmail(fromEmail?: string): string {
  const email = fromEmail ?? DEFAULT_EMAIL;
  if (!email) {
    throw new Error(
      "from_email is required. Set PAGERDUTY_USER_EMAIL env var or pass from_email parameter.",
    );
  }
  return email;
}

export class IncidentWriteTools {
  constructor(private pagerDutyService: PagerDutyService) {}

  async acknowledge_incident(
    args: z.infer<typeof IncidentWriteToolSchemas.acknowledge_incident.schema>,
  ) {
    const result = await this.pagerDutyService.acknowledgeIncident(
      args.incident_id,
      resolveEmail(args.from_email),
    );
    return formatMcpResponse(result, `Incident ${args.incident_id} acknowledged`);
  }

  async resolve_incident(args: z.infer<typeof IncidentWriteToolSchemas.resolve_incident.schema>) {
    const result = await this.pagerDutyService.resolveIncident(
      args.incident_id,
      resolveEmail(args.from_email),
    );
    return formatMcpResponse(result, `Incident ${args.incident_id} resolved`);
  }

  async reassign_incident(args: z.infer<typeof IncidentWriteToolSchemas.reassign_incident.schema>) {
    const result = await this.pagerDutyService.reassignIncident(
      args.incident_id,
      args.user_ids,
      resolveEmail(args.from_email),
    );
    return formatMcpResponse(result, `Incident ${args.incident_id} reassigned`);
  }

  async add_incident_note(args: z.infer<typeof IncidentWriteToolSchemas.add_incident_note.schema>) {
    const result = await this.pagerDutyService.addIncidentNote(
      args.incident_id,
      args.content,
      resolveEmail(args.from_email),
    );
    return formatMcpResponse(result, `Note added to incident ${args.incident_id}`);
  }
}
