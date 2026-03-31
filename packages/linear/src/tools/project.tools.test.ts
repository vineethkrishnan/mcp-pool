import { ProjectTools } from "./project.tools";
import { LinearService } from "../services/linear.service";

jest.mock("../services/linear.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ProjectTools", () => {
  let tools: ProjectTools;
  let mockService: jest.Mocked<LinearService>;

  beforeEach(() => {
    mockService = new LinearService({
      apiKey: "lin_api_fake",
    }) as jest.Mocked<LinearService>;
    tools = new ProjectTools(mockService);
  });

  it("should list_projects with default parameters", async () => {
    const mockProjects = {
      nodes: [{ id: "p1", name: "Alpha", state: "started", progress: 0.5 }],
    };
    mockService.listProjects.mockResolvedValue(mockProjects);

    const result = await tools.list_projects({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProjects, null, 2) }],
    });
    expect(mockService.listProjects).toHaveBeenCalledWith(25);
  });

  it("should list_projects with custom limit", async () => {
    const mockProjects = { nodes: [] };
    mockService.listProjects.mockResolvedValue(mockProjects);

    const result = await tools.list_projects({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProjects, null, 2) }],
    });
    expect(mockService.listProjects).toHaveBeenCalledWith(10);
  });

  it("should get_project and return MCP formatted content", async () => {
    const mockProject = {
      id: "p1",
      name: "Alpha",
      description: "Main project",
      state: "started",
      progress: 0.75,
    };
    mockService.getProject.mockResolvedValue(mockProject);

    const result = await tools.get_project({ project_id: "p1" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockProject, null, 2) }],
    });
    expect(mockService.getProject).toHaveBeenCalledWith("p1");
  });
});
