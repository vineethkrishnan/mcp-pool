import { GoogleAuthService } from "./auth.service";

export class SheetsService {
  private baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";

  constructor(private auth: GoogleAuthService) {}

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Sheets authentication failed. Your access token may be expired.");
        case 403:
          throw new Error("Sheets access denied. Token may lack the spreadsheets.readonly scope.");
        case 404:
          throw new Error("Spreadsheet not found. Check the spreadsheet ID.");
        case 429:
          throw new Error("Sheets API rate limit exceeded. Try again later.");
        default:
          throw new Error(
            `Sheets API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  async getSpreadsheet(spreadsheetId: string): Promise<unknown> {
    const data = await this.request<{
      spreadsheetId?: string;
      properties?: { title?: string };
      sheets?: Array<{
        properties?: {
          sheetId?: number;
          title?: string;
          index?: number;
          gridProperties?: { rowCount?: number; columnCount?: number };
        };
      }>;
    }>(`/${spreadsheetId}`, {
      fields: "spreadsheetId,properties.title,sheets.properties",
    });

    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties?.title ?? "(untitled)",
      sheets: (data.sheets ?? []).map((sheet) => ({
        sheetId: sheet.properties?.sheetId,
        title: sheet.properties?.title ?? "(untitled)",
        index: sheet.properties?.index ?? 0,
        rowCount: sheet.properties?.gridProperties?.rowCount ?? 0,
        columnCount: sheet.properties?.gridProperties?.columnCount ?? 0,
      })),
    };
  }

  async getSheetValues(spreadsheetId: string, range: string): Promise<unknown> {
    const encodedRange = encodeURIComponent(range);
    const data = await this.request<{
      range?: string;
      majorDimension?: string;
      values?: unknown[][];
    }>(`/${spreadsheetId}/values/${encodedRange}`);

    return {
      range: data.range ?? range,
      values: data.values ?? [],
    };
  }

  async listSheets(spreadsheetId: string): Promise<unknown> {
    const data = await this.request<{
      sheets?: Array<{
        properties?: {
          sheetId?: number;
          title?: string;
          index?: number;
          gridProperties?: { rowCount?: number; columnCount?: number };
        };
      }>;
    }>(`/${spreadsheetId}`, {
      fields: "sheets.properties",
    });

    return {
      sheets: (data.sheets ?? []).map((sheet) => ({
        sheetId: sheet.properties?.sheetId,
        title: sheet.properties?.title ?? "(untitled)",
        index: sheet.properties?.index ?? 0,
        rowCount: sheet.properties?.gridProperties?.rowCount ?? 0,
        columnCount: sheet.properties?.gridProperties?.columnCount ?? 0,
      })),
    };
  }
}
