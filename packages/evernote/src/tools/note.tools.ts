import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatNoteMetadata, enmlToPlainText } from "../common/utils";

export const NoteToolSchemas = {
  list_notes: {
    description:
      "Lists recent notes, optionally filtered by notebook. Returns note title, GUID, timestamps, and tag GUIDs.",
    schema: z.object({
      notebook_guid: z
        .string()
        .optional()
        .describe("Filter notes by notebook GUID. If omitted, lists notes from all notebooks."),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Maximum number of notes to return (default: 25, max: 250)."),
      offset: z
        .number()
        .optional()
        .default(0)
        .describe("Number of notes to skip for pagination (default: 0)."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_note: {
    description:
      "Retrieves a specific note with its full content converted to plain text. Includes title, timestamps, tags, and readable content.",
    schema: z.object({
      note_guid: z.string().describe("The GUID of the note to retrieve."),
    }),
    annotations: { readOnlyHint: true },
  },
  search_notes: {
    description:
      "Searches notes using Evernote search grammar. Supports keywords, notebook:, tag:, created:, updated:, and more.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "Search query using Evernote grammar. Examples: 'meeting notes', 'notebook:Work tag:important', 'created:20250101'.",
        ),
      limit: z
        .number()
        .optional()
        .default(25)
        .describe("Maximum number of results (default: 25, max: 250)."),
      offset: z
        .number()
        .optional()
        .default(0)
        .describe("Number of results to skip for pagination (default: 0)."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class NoteTools {
  constructor(private evernoteService: EvernoteService) {}

  async list_notes(args: z.infer<typeof NoteToolSchemas.list_notes.schema>) {
    const result = await this.evernoteService.listNotes(
      args.notebook_guid,
      args.limit,
      args.offset,
    );
    const notes = (result.notes ?? []).map((note) =>
      formatNoteMetadata(note as unknown as Record<string, unknown>),
    );
    return formatMcpResponse({
      total_notes: result.totalNotes,
      notes,
    });
  }

  async get_note(args: z.infer<typeof NoteToolSchemas.get_note.schema>) {
    const note = await this.evernoteService.getNote(args.note_guid, true);
    const metadata = formatNoteMetadata(note as unknown as Record<string, unknown>);
    const content = enmlToPlainText(note.content ?? "");
    return formatMcpResponse({
      ...metadata,
      content,
    });
  }

  async search_notes(args: z.infer<typeof NoteToolSchemas.search_notes.schema>) {
    const result = await this.evernoteService.searchNotes(args.query, args.limit, args.offset);
    const notes = (result.notes ?? []).map((note) =>
      formatNoteMetadata(note as unknown as Record<string, unknown>),
    );
    return formatMcpResponse({
      total_notes: result.totalNotes,
      notes,
    });
  }
}
