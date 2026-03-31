import { TeamTools } from "./team.tools";
import { LinearService } from "../services/linear.service";

jest.mock("../services/linear.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("TeamTools", () => {
  let tools: TeamTools;
  let mockService: jest.Mocked<LinearService>;

  beforeEach(() => {
    mockService = new LinearService({
      apiKey: "lin_api_fake",
    }) as jest.Mocked<LinearService>;
    tools = new TeamTools(mockService);
  });

  it("should list_teams with default parameters", async () => {
    const mockTeams = {
      nodes: [{ id: "t1", name: "Engineering", key: "ENG", description: "Engineering team" }],
    };
    mockService.listTeams.mockResolvedValue(mockTeams);

    const result = await tools.list_teams({ limit: 25 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockTeams, null, 2) }],
    });
    expect(mockService.listTeams).toHaveBeenCalledWith(25);
  });

  it("should list_teams with custom limit", async () => {
    const mockTeams = { nodes: [] };
    mockService.listTeams.mockResolvedValue(mockTeams);

    const result = await tools.list_teams({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockTeams, null, 2) }],
    });
    expect(mockService.listTeams).toHaveBeenCalledWith(5);
  });
});
