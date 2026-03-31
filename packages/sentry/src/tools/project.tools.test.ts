import { ProjectTools } from "./project.tools";
import { SentryService } from "../services/sentry.service";

jest.mock("../services/sentry.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ProjectTools", () => {
  let tools: ProjectTools;
  let mockService: jest.Mocked<SentryService>;

  beforeEach(() => {
    mockService = new SentryService({
      authToken: "fake_token",
      baseUrl: "https://sentry.io",
    }) as jest.Mocked<SentryService>;
    tools = new ProjectTools(mockService);
  });

  it("should list_projects with default org and return MCP formatted content", async () => {
    const mockProjects = [
      { slug: "my-frontend", name: "My Frontend" },
      { slug: "my-backend", name: "My Backend" },
    ];
    mockService.listProjects.mockResolvedValue(mockProjects);

    const result = await tools.list_projects({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProjects, null, 2) }],
    });
    expect(mockService.listProjects).toHaveBeenCalledWith(undefined);
  });

  it("should list_projects with explicit org", async () => {
    const mockProjects = [{ slug: "proj-1", name: "Project 1" }];
    mockService.listProjects.mockResolvedValue(mockProjects);

    const result = await tools.list_projects({ org: "custom-org" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProjects, null, 2) }],
    });
    expect(mockService.listProjects).toHaveBeenCalledWith("custom-org");
  });
});
