import { DriveTools } from "./drive.tools";
import { DriveService } from "../services/drive.service";

jest.mock("../services/drive.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("DriveTools", () => {
  let tools: DriveTools;
  let mockService: jest.Mocked<DriveService>;

  beforeEach(() => {
    const MockDriveService = DriveService as jest.MockedClass<typeof DriveService>;
    mockService = new MockDriveService({} as never) as jest.Mocked<DriveService>;
    tools = new DriveTools(mockService);
  });

  it("should list_files with default params", async () => {
    const mockFiles = { files: [{ name: "report.pdf" }] };
    mockService.listFiles.mockResolvedValue(mockFiles);

    const result = await tools.list_files({ max_results: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockFiles, null, 2) }],
    });
    expect(mockService.listFiles).toHaveBeenCalledWith(undefined, 10);
  });

  it("should list_files with query", async () => {
    const mockFiles = { files: [] };
    mockService.listFiles.mockResolvedValue(mockFiles);

    await tools.list_files({ query: "name contains 'report'", max_results: 20 });

    expect(mockService.listFiles).toHaveBeenCalledWith("name contains 'report'", 20);
  });

  it("should get_file with file ID", async () => {
    const mockFile = { name: "doc.pdf", mimeType: "application/pdf" };
    mockService.getFile.mockResolvedValue(mockFile);

    const result = await tools.get_file({ file_id: "file-1" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockFile, null, 2) }],
    });
    expect(mockService.getFile).toHaveBeenCalledWith("file-1");
  });

  it("should search_files with query", async () => {
    const mockFiles = { files: [{ name: "budget.xlsx" }] };
    mockService.searchFiles.mockResolvedValue(mockFiles);

    const result = await tools.search_files({
      query: "mimeType='application/pdf'",
      max_results: 10,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockFiles, null, 2) }],
    });
    expect(mockService.searchFiles).toHaveBeenCalledWith("mimeType='application/pdf'", 10);
  });
});
