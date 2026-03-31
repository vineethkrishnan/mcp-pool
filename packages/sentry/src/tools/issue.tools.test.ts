import { IssueTools } from "./issue.tools";
import { SentryService } from "../services/sentry.service";

jest.mock("../services/sentry.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("IssueTools", () => {
  let tools: IssueTools;
  let mockService: jest.Mocked<SentryService>;

  beforeEach(() => {
    mockService = new SentryService({
      authToken: "fake_token",
      baseUrl: "https://sentry.io",
    }) as jest.Mocked<SentryService>;
    tools = new IssueTools(mockService);
  });

  it("should get_issue and return MCP formatted content", async () => {
    const mockIssue = {
      id: "12345",
      title: "TypeError: Cannot read property 'foo' of undefined",
      status: "unresolved",
    };
    mockService.getIssue.mockResolvedValue(mockIssue);

    const result = await tools.get_issue({ issue_id: "12345" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssue, null, 2) }],
    });
    expect(mockService.getIssue).toHaveBeenCalledWith("12345");
  });

  it("should list_issues with all parameters", async () => {
    const mockIssues = [{ id: "111", title: "Error A" }];
    mockService.listIssues.mockResolvedValue(mockIssues);

    const result = await tools.list_issues({
      project: "my-frontend",
      org: "my-org",
      query: "is:unresolved level:error",
      sort: "priority",
      limit: 10,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.listIssues).toHaveBeenCalledWith(
      "my-frontend",
      "my-org",
      "is:unresolved level:error",
      "priority",
      10,
    );
  });

  it("should list_issues with only required parameters", async () => {
    const mockIssues = [{ id: "222", title: "Error B" }];
    mockService.listIssues.mockResolvedValue(mockIssues);

    const result = await tools.list_issues({
      project: "my-backend",
      limit: 25,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.listIssues).toHaveBeenCalledWith(
      "my-backend",
      undefined,
      undefined,
      undefined,
      25,
    );
  });

  it("should search_issues with all parameters", async () => {
    const mockIssues = [{ id: "333", title: "TypeError" }];
    mockService.searchIssues.mockResolvedValue(mockIssues);

    const result = await tools.search_issues({
      query: "TypeError",
      org: "my-org",
      limit: 50,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.searchIssues).toHaveBeenCalledWith("TypeError", "my-org", 50);
  });

  it("should search_issues with only required parameters", async () => {
    const mockIssues = [{ id: "444", title: "ReferenceError" }];
    mockService.searchIssues.mockResolvedValue(mockIssues);

    const result = await tools.search_issues({
      query: "is:unresolved assigned:me",
      limit: 25,
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockIssues, null, 2) }],
    });
    expect(mockService.searchIssues).toHaveBeenCalledWith(
      "is:unresolved assigned:me",
      undefined,
      25,
    );
  });
});
