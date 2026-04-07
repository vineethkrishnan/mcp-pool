import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatNotebookMetadata } from "../common/utils";

export const NotebookWriteToolSchemas = {
  create_notebook: {
    description: "Creates a new notebook in Evernote.",
    schema: z.object({
      name: z.string().describe("Name of the new notebook."),
    }),
    annotations: {
      title: "Create Notebook",
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
};

export class NotebookWriteTools {
  constructor(private evernoteService: EvernoteService) {}

  async create_notebook(args: z.infer<typeof NotebookWriteToolSchemas.create_notebook.schema>) {
    const notebook = await this.evernoteService.createNotebook(args.name);
    return formatMcpResponse(
      formatNotebookMetadata(notebook as unknown as Record<string, unknown>),
      "Notebook created successfully.",
    );
  }
}
