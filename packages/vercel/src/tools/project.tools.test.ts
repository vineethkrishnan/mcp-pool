import { ProjectTools } from "./project.tools";
import { VercelService } from "../services/vercel.service";

jest.mock("../services/vercel.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("ProjectTools", () => {
  let tools: ProjectTools;
  let mockService: jest.Mocked<VercelService>;

  beforeEach(() => {
    mockService = new VercelService({
      token: "fake_token",
    }) as jest.Mocked<VercelService>;
    tools = new ProjectTools(mockService);
  });

  // ===========================================================================
  // list_projects
  // ===========================================================================

  describe("list_projects", () => {
    it("calls listProjects with default limit and returns MCP formatted content", async () => {
      const mockProjects = { projects: [{ id: "prj_1", name: "my-app" }] };
      mockService.listProjects.mockResolvedValue(mockProjects);

      const result = await tools.list_projects({});

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockProjects, null, 2) }],
      });
      expect(mockService.listProjects).toHaveBeenCalledWith(undefined);
    });

    it("passes custom limit to service", async () => {
      const mockProjects = { projects: [] };
      mockService.listProjects.mockResolvedValue(mockProjects);

      await tools.list_projects({ limit: 5 });

      expect(mockService.listProjects).toHaveBeenCalledWith(5);
    });
  });

  // ===========================================================================
  // get_project
  // ===========================================================================

  describe("get_project", () => {
    it("calls getProject with project_id and returns MCP formatted content", async () => {
      const mockProject = { id: "prj_123", name: "my-app", framework: "nextjs" };
      mockService.getProject.mockResolvedValue(mockProject);

      const result = await tools.get_project({ project_id: "prj_123" });

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockProject, null, 2) }],
      });
      expect(mockService.getProject).toHaveBeenCalledWith("prj_123");
    });

    it("accepts project name as project_id", async () => {
      const mockProject = { id: "prj_456", name: "my-blog" };
      mockService.getProject.mockResolvedValue(mockProject);

      await tools.get_project({ project_id: "my-blog" });

      expect(mockService.getProject).toHaveBeenCalledWith("my-blog");
    });
  });
});
