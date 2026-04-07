import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatNotebookMetadata } from "../common/utils";

export const NotebookToolSchemas = {
  list_notebooks: {
    description:
      "Lists all notebooks in the Evernote account. Returns notebook name, GUID, and whether it is the default notebook.",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
  },
  get_notebook: {
    description:
      "Retrieves full details for a specific notebook including name, creation date, update date, and sharing settings.",
    schema: z.object({
      notebook_guid: z.string().describe("The GUID of the notebook to retrieve."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class NotebookTools {
  constructor(private evernoteService: EvernoteService) {}

  async list_notebooks() {
    const notebooks = await this.evernoteService.listNotebooks();
    const formatted = notebooks.map((nb) =>
      formatNotebookMetadata(nb as unknown as Record<string, unknown>),
    );
    return formatMcpResponse(formatted);
  }

  async get_notebook(args: z.infer<typeof NotebookToolSchemas.get_notebook.schema>) {
    const notebook = await this.evernoteService.getNotebook(args.notebook_guid);
    return formatMcpResponse(
      formatNotebookMetadata(notebook as unknown as Record<string, unknown>),
    );
  }
}
