import { IssueTools } from "./issue.tools";
import { LinearService } from "../services/linear.service";

jest.mock("../services/linear.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("IssueTools", () => {
  let tools: IssueTools;
  let mockService: jest.Mocked<LinearService>;

  beforeEach(() => {
    mockService = new LinearService({
      apiKey: "lin_api_fake",
    }) as jest.Mocked<LinearService>;
    tools = new IssueTools(mockService);
  });

  it("should list_issues with default parameters", async () => {
    const mockIssues = { nodes: [{ id: "i1", identifier: "ENG-1", title: "Bug" }] };
    mockService.listIssues.mockResolvedValue(mockIssues);

    const result = await tools.list_issues({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.listIssues).toHaveBeenCalledWith(undefined, undefined, 25);
  });

  it("should list_issues with all parameters", async () => {
    const mockIssues = { nodes: [{ id: "i1", title: "Bug" }] };
    mockService.listIssues.mockResolvedValue(mockIssues);

    const result = await tools.list_issues({
      team_id: "team-123",
      status: "In Progress",
      limit: 10,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.listIssues).toHaveBeenCalledWith("team-123", "In Progress", 10);
  });

  it("should get_issue and return MCP formatted content", async () => {
    const mockIssue = {
      id: "i1",
      identifier: "ENG-123",
      title: "Fix null pointer",
      priority: 2,
    };
    mockService.getIssue.mockResolvedValue(mockIssue);

    const result = await tools.get_issue({ issue_id: "ENG-123" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssue, null, 2) }],
    });
    expect(mockService.getIssue).toHaveBeenCalledWith("ENG-123");
  });

  it("should search_issues with all parameters", async () => {
    const mockResults = { nodes: [{ id: "i1", title: "Match" }] };
    mockService.searchIssues.mockResolvedValue(mockResults);

    const result = await tools.search_issues({ query: "bug fix", limit: 50 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResults, null, 2) }],
    });
    expect(mockService.searchIssues).toHaveBeenCalledWith("bug fix", 50);
  });

  it("should search_issues with only required parameters", async () => {
    const mockResults = { nodes: [{ id: "i2", title: "Another match" }] };
    mockService.searchIssues.mockResolvedValue(mockResults);

    const result = await tools.search_issues({ query: "error", limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockResults, null, 2) }],
    });
    expect(mockService.searchIssues).toHaveBeenCalledWith("error", 25);
  });
});
