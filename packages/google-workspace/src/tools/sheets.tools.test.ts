import { SheetsTools } from "./sheets.tools";
import { SheetsService } from "../services/sheets.service";

jest.mock("../services/sheets.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("SheetsTools", () => {
  let tools: SheetsTools;
  let mockService: jest.Mocked<SheetsService>;

  beforeEach(() => {
    const MockSheetsService = SheetsService as jest.MockedClass<typeof SheetsService>;
    mockService = new MockSheetsService({} as never) as jest.Mocked<SheetsService>;
    tools = new SheetsTools(mockService);
  });

  it("should get_spreadsheet with spreadsheet ID", async () => {
    const mockSpreadsheet = { spreadsheetId: "abc", title: "Budget", sheets: [] };
    mockService.getSpreadsheet.mockResolvedValue(mockSpreadsheet);

    const result = await tools.get_spreadsheet({ spreadsheet_id: "abc" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSpreadsheet, null, 2) }],
    });
    expect(mockService.getSpreadsheet).toHaveBeenCalledWith("abc");
  });

  it("should get_sheet_values with spreadsheet ID and range", async () => {
    const mockValues = {
      range: "Sheet1!A1:D10",
      values: [
        ["a", "b"],
        ["c", "d"],
      ],
    };
    mockService.getSheetValues.mockResolvedValue(mockValues);

    const result = await tools.get_sheet_values({ spreadsheet_id: "abc", range: "Sheet1!A1:D10" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockValues, null, 2) }],
    });
    expect(mockService.getSheetValues).toHaveBeenCalledWith("abc", "Sheet1!A1:D10");
  });

  it("should list_sheets with spreadsheet ID", async () => {
    const mockSheets = { sheets: [{ title: "Sheet1", sheetId: 0 }] };
    mockService.listSheets.mockResolvedValue(mockSheets);

    const result = await tools.list_sheets({ spreadsheet_id: "abc" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockSheets, null, 2) }],
    });
    expect(mockService.listSheets).toHaveBeenCalledWith("abc");
  });
});
