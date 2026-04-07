declare module "evernote" {
  export class Client {
    constructor(options: { token: string; sandbox: boolean; china?: boolean });
    getNoteStore(): NoteStoreClient;
  }

  export interface NoteStoreClient {
    listNotebooks(): Promise<Types.Notebook[]>;
    getNotebook(guid: string): Promise<Types.Notebook>;
    createNotebook(notebook: Types.Notebook): Promise<Types.Notebook>;
    findNotes(
      filter: NoteStore.NoteFilter,
      offset: number,
      maxNotes: number,
    ): Promise<NoteStore.NoteList>;
    getNote(
      guid: string,
      withContent: boolean,
      withResourcesData: boolean,
      withResourcesRecognition: boolean,
      withResourcesAlternateData: boolean,
    ): Promise<Types.Note>;
    createNote(note: Types.Note): Promise<Types.Note>;
    updateNote(note: Types.Note): Promise<Types.Note>;
    deleteNote(guid: string): Promise<number>;
    listTags(): Promise<Types.Tag[]>;
    createTag(tag: Types.Tag): Promise<Types.Tag>;
  }

  export namespace Types {
    class Notebook {
      guid?: string;
      name?: string;
      defaultNotebook?: boolean;
      serviceCreated?: number;
      serviceUpdated?: number;
    }

    class Note {
      guid?: string;
      title?: string;
      content?: string;
      contentLength?: number;
      notebookGuid?: string;
      tagGuids?: string[];
      tagNames?: string[];
      created?: number;
      updated?: number;
    }

    class Tag {
      guid?: string;
      name?: string;
      parentGuid?: string;
    }

    enum NoteSortOrder {
      CREATED = 1,
      UPDATED = 2,
      RELEVANCE = 3,
      UPDATE_SEQUENCE_NUMBER = 4,
      TITLE = 5,
    }
  }

  export namespace NoteStore {
    class NoteFilter {
      notebookGuid?: string;
      words?: string;
      order?: Types.NoteSortOrder;
      ascending?: boolean;
      tagGuids?: string[];
    }

    interface NoteList {
      startIndex?: number;
      totalNotes?: number;
      notes?: Types.Note[];
    }
  }

  export default {
    Client: Client,
    Types: Types,
    NoteStore: NoteStore,
  };
}
