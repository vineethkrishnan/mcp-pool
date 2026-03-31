import { DeploymentTools } from "./deployment.tools";
import { VercelService } from "../services/vercel.service";

jest.mock("../services/vercel.service");
jest.mock("../common/utils", () => {
  const actual = jest.requireActual("../common/utils");
  return {
    ...actual,
    formatMcpResponse: (data: unknown) => ({
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    }),
  };
});

describe("DeploymentTools", () => {
  let tools: DeploymentTools;
  let mockService: jest.Mocked<VercelService>;

  beforeEach(() => {
    mockService = new VercelService({
      token: "fake_token",
    }) as jest.Mocked<VercelService>;
    tools = new DeploymentTools(mockService);
  });

  // ===========================================================================
  // list_deployments
  // ===========================================================================

  describe("list_deployments", () => {
    it("calls listDeployments with no filters and returns MCP formatted content", async () => {
      const mockDeployments = { deployments: [{ id: "dpl_1", state: "READY" }] };
      mockService.listDeployments.mockResolvedValue(mockDeployments);

      const result = await tools.list_deployments({});

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockDeployments, null, 2) }],
      });
      expect(mockService.listDeployments).toHaveBeenCalledWith(undefined, undefined);
    });

    it("passes project_id filter to service", async () => {
      mockService.listDeployments.mockResolvedValue({ deployments: [] });

      await tools.list_deployments({ project_id: "prj_123" });

      expect(mockService.listDeployments).toHaveBeenCalledWith("prj_123", undefined);
    });

    it("passes limit to service", async () => {
      mockService.listDeployments.mockResolvedValue({ deployments: [] });

      await tools.list_deployments({ limit: 5 });

      expect(mockService.listDeployments).toHaveBeenCalledWith(undefined, 5);
    });

    it("passes both project_id and limit to service", async () => {
      mockService.listDeployments.mockResolvedValue({ deployments: [] });

      await tools.list_deployments({ project_id: "prj_123", limit: 10 });

      expect(mockService.listDeployments).toHaveBeenCalledWith("prj_123", 10);
    });
  });

  // ===========================================================================
  // get_deployment
  // ===========================================================================

  describe("get_deployment", () => {
    it("calls getDeployment with deployment_id and returns MCP formatted content", async () => {
      const mockDeployment = { id: "dpl_abc", state: "READY", url: "my-app.vercel.app" };
      mockService.getDeployment.mockResolvedValue(mockDeployment);

      const result = await tools.get_deployment({ deployment_id: "dpl_abc" });

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockDeployment, null, 2) }],
      });
      expect(mockService.getDeployment).toHaveBeenCalledWith("dpl_abc");
    });
  });

  // ===========================================================================
  // get_deployment_build_logs
  // ===========================================================================

  describe("get_deployment_build_logs", () => {
    it("extracts text from events and strips ANSI codes", async () => {
      const mockEvents = [
        { text: "\x1b[32mCompiling...\x1b[0m" },
        { text: "\x1b[31mError: Module not found\x1b[0m" },
      ];
      mockService.getDeploymentBuildLogs.mockResolvedValue(mockEvents);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toContain("Compiling...");
      expect(result.content[0].text).toContain("Error: Module not found");
      expect(result.content[0].text).not.toContain("\x1b[");
    });

    it("handles events with payload.text format", async () => {
      const mockEvents = [
        { payload: { text: "Building..." } },
        { payload: { text: "Build complete" } },
      ];
      mockService.getDeploymentBuildLogs.mockResolvedValue(mockEvents);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toContain("Building...");
      expect(result.content[0].text).toContain("Build complete");
    });

    it("filters out empty lines", async () => {
      const mockEvents = [{ text: "Line 1" }, { text: "   " }, { text: "" }, { text: "Line 2" }];
      mockService.getDeploymentBuildLogs.mockResolvedValue(mockEvents);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toBe("Line 1\nLine 2");
    });

    it("truncates logs exceeding 150 lines", async () => {
      const mockEvents = Array.from({ length: 200 }, (_, i) => ({
        text: `Build step ${i}`,
      }));
      mockService.getDeploymentBuildLogs.mockResolvedValue(mockEvents);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toContain("[truncated");
      expect(result.content[0].text).toContain("showing last 150 of 200 lines");
    });

    it("handles empty events array", async () => {
      mockService.getDeploymentBuildLogs.mockResolvedValue([]);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toBe("");
    });

    it("skips events without text or payload.text", async () => {
      const mockEvents = [{ type: "command" }, { text: "Actual log line" }, { type: "stdout" }];
      mockService.getDeploymentBuildLogs.mockResolvedValue(mockEvents);

      const result = await tools.get_deployment_build_logs({ deployment_id: "dpl_abc" });

      expect(result.content[0].text).toBe("Actual log line");
    });
  });
});
