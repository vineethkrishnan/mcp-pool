import { z } from "zod";
import { SheetsService } from "../services/sheets.service";
import { formatMcpResponse } from "../common/utils";

export const SheetsToolSchemas = {
  get_spreadsheet: {
    description:
      "Retrieves spreadsheet metadata including title, sheet names, and sheet dimensions (row/column counts).",
    schema: z.object({
      spreadsheet_id: z.string().describe("The Google Sheets spreadsheet ID."),
    }),
    annotations: { readOnlyHint: true },
  },
  get_sheet_values: {
    description:
      "Reads cell values for a given A1 notation range (e.g., 'Sheet1!A1:D50'). Returns values as a 2D array.",
    schema: z.object({
      spreadsheet_id: z.string().describe("The Google Sheets spreadsheet ID."),
      range: z.string().describe("A1 notation range (e.g., 'Sheet1!A1:D50', 'A1:Z100')."),
    }),
    annotations: { readOnlyHint: true },
  },
  list_sheets: {
    description:
      "Lists all sheets (tabs) in a spreadsheet with their names, indices, and row/column counts.",
    schema: z.object({
      spreadsheet_id: z.string().describe("The Google Sheets spreadsheet ID."),
    }),
    annotations: { readOnlyHint: true },
  },
};

export class SheetsTools {
  constructor(private sheetsService: SheetsService) {}

  async get_spreadsheet(args: z.infer<typeof SheetsToolSchemas.get_spreadsheet.schema>) {
    const result = await this.sheetsService.getSpreadsheet(args.spreadsheet_id);
    return formatMcpResponse(result);
  }

  async get_sheet_values(args: z.infer<typeof SheetsToolSchemas.get_sheet_values.schema>) {
    const result = await this.sheetsService.getSheetValues(args.spreadsheet_id, args.range);
    return formatMcpResponse(result);
  }

  async list_sheets(args: z.infer<typeof SheetsToolSchemas.list_sheets.schema>) {
    const result = await this.sheetsService.listSheets(args.spreadsheet_id);
    return formatMcpResponse(result);
  }
}
