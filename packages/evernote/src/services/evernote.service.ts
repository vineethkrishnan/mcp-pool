import { Client, Types, NoteStore, NoteStoreClient } from "evernote";
import { EvernoteConfig } from "../common/types";

export class EvernoteService {
  private client: Client;
  private noteStorePromise: Promise<NoteStoreClient> | null = null;

  constructor(config: EvernoteConfig) {
    this.client = new Client({
      token: config.token,
      sandbox: config.sandbox,
    });
  }

  private async getNoteStore(): Promise<NoteStoreClient> {
    if (!this.noteStorePromise) {
      this.noteStorePromise = Promise.resolve(this.client.getNoteStore());
    }
    return this.noteStorePromise;
  }

  // ===========================================================================
  // Notebooks
  // ===========================================================================

  async listNotebooks(): Promise<Types.Notebook[]> {
    const noteStore = await this.getNoteStore();
    return noteStore.listNotebooks();
  }

  async getNotebook(guid: string): Promise<Types.Notebook> {
    const noteStore = await this.getNoteStore();
    return noteStore.getNotebook(guid);
  }

  async createNotebook(name: string): Promise<Types.Notebook> {
    const noteStore = await this.getNoteStore();
    const notebook = new Types.Notebook();
    notebook.name = name;
    return noteStore.createNotebook(notebook);
  }

  // ===========================================================================
  // Notes
  // ===========================================================================

  async listNotes(
    notebookGuid?: string,
    limit: number = 25,
    offset: number = 0,
  ): Promise<NoteStore.NoteList> {
    const noteStore = await this.getNoteStore();
    const filter = new NoteStore.NoteFilter();
    if (notebookGuid) {
      filter.notebookGuid = notebookGuid;
    }
    filter.order = Types.NoteSortOrder.UPDATED;
    filter.ascending = false;
    return noteStore.findNotes(filter, offset, Math.min(limit, 250));
  }

  async getNote(guid: string, withContent: boolean = true): Promise<Types.Note> {
    const noteStore = await this.getNoteStore();
    return noteStore.getNote(guid, withContent, false, false, false);
  }

  async searchNotes(
    query: string,
    limit: number = 25,
    offset: number = 0,
  ): Promise<NoteStore.NoteList> {
    const noteStore = await this.getNoteStore();
    const filter = new NoteStore.NoteFilter();
    filter.words = query;
    filter.order = Types.NoteSortOrder.RELEVANCE;
    filter.ascending = false;
    return noteStore.findNotes(filter, offset, Math.min(limit, 250));
  }

  async createNote(
    title: string,
    content: string,
    notebookGuid?: string,
    tagNames?: string[],
  ): Promise<Types.Note> {
    const noteStore = await this.getNoteStore();
    const note = new Types.Note();
    note.title = title;
    note.content = content;
    if (notebookGuid) note.notebookGuid = notebookGuid;
    if (tagNames?.length) note.tagNames = tagNames;
    return noteStore.createNote(note);
  }

  async updateNote(
    guid: string,
    title?: string,
    content?: string,
    notebookGuid?: string,
    tagNames?: string[],
  ): Promise<Types.Note> {
    const noteStore = await this.getNoteStore();
    const note = new Types.Note();
    note.guid = guid;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (notebookGuid !== undefined) note.notebookGuid = notebookGuid;
    if (tagNames !== undefined) note.tagNames = tagNames;
    return noteStore.updateNote(note);
  }

  async deleteNote(guid: string): Promise<number> {
    const noteStore = await this.getNoteStore();
    return noteStore.deleteNote(guid);
  }

  // ===========================================================================
  // Tags
  // ===========================================================================

  async listTags(): Promise<Types.Tag[]> {
    const noteStore = await this.getNoteStore();
    return noteStore.listTags();
  }

  async createTag(name: string, parentGuid?: string): Promise<Types.Tag> {
    const noteStore = await this.getNoteStore();
    const tag = new Types.Tag();
    tag.name = name;
    if (parentGuid) tag.parentGuid = parentGuid;
    return noteStore.createTag(tag);
  }
}
