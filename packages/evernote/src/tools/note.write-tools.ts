import { z } from "zod";
import { EvernoteService } from "../services/evernote.service";
import { formatMcpResponse, formatNoteMetadata, plainTextToEnml } from "../common/utils";

export const NoteWriteToolSchemas = {
  create_note: {
    description:
      "Creates a new note in Evernote. Content is provided as plain text and automatically converted to Evernote's note format.",
    schema: z.object({
      title: z.string().describe("Title of the note."),
      content: z.string().describe("Plain text content for the note body."),
      notebook_guid: z
        .string()
        .optional()
        .describe("GUID of the notebook to create the note in. Uses default notebook if omitted."),
      tags: z
        .array(z.string())
        .optional()
        .describe("List of tag names to apply to the note. Tags are created if they don't exist."),
    }),
    annotations: {
      title: "Create Note",
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  update_note: {
    description:
      "Updates an existing note's title, content, notebook, or tags. Only provided fields are changed.",
    schema: z.object({
      note_guid: z.string().describe("GUID of the note to update."),
      title: z.string().optional().describe("New title for the note."),
      content: z
        .string()
        .optional()
        .describe("New plain text content. Replaces the entire note body."),
      notebook_guid: z.string().optional().describe("GUID of the notebook to move the note to."),
      tags: z
        .array(z.string())
        .optional()
        .describe("New list of tag names. Replaces all existing tags on the note."),
    }),
    annotations: {
      title: "Update Note",
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  delete_note: {
    description: "Moves a note to the trash. The note can be restored from Evernote's trash.",
    schema: z.object({
      note_guid: z.string().describe("GUID of the note to delete."),
    }),
    annotations: {
      title: "Delete Note",
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  move_note: {
    description: "Moves a note to a different notebook.",
    schema: z.object({
      note_guid: z.string().describe("GUID of the note to move."),
      notebook_guid: z.string().describe("GUID of the destination notebook."),
    }),
    annotations: {
      title: "Move Note",
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
};

export class NoteWriteTools {
  constructor(private evernoteService: EvernoteService) {}

  async create_note(args: z.infer<typeof NoteWriteToolSchemas.create_note.schema>) {
    const enmlContent = plainTextToEnml(args.content);
    const note = await this.evernoteService.createNote(
      args.title,
      enmlContent,
      args.notebook_guid,
      args.tags,
    );
    return formatMcpResponse(
      formatNoteMetadata(note as unknown as Record<string, unknown>),
      "Note created successfully.",
    );
  }

  async update_note(args: z.infer<typeof NoteWriteToolSchemas.update_note.schema>) {
    const enmlContent = args.content ? plainTextToEnml(args.content) : undefined;
    const note = await this.evernoteService.updateNote(
      args.note_guid,
      args.title,
      enmlContent,
      args.notebook_guid,
      args.tags,
    );
    return formatMcpResponse(
      formatNoteMetadata(note as unknown as Record<string, unknown>),
      "Note updated successfully.",
    );
  }

  async delete_note(args: z.infer<typeof NoteWriteToolSchemas.delete_note.schema>) {
    await this.evernoteService.deleteNote(args.note_guid);
    return formatMcpResponse({ note_guid: args.note_guid, deleted: true }, "Note moved to trash.");
  }

  async move_note(args: z.infer<typeof NoteWriteToolSchemas.move_note.schema>) {
    const note = await this.evernoteService.updateNote(
      args.note_guid,
      undefined,
      undefined,
      args.notebook_guid,
    );
    return formatMcpResponse(
      formatNoteMetadata(note as unknown as Record<string, unknown>),
      "Note moved successfully.",
    );
  }
}
