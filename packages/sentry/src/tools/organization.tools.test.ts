import { OrganizationTools } from "./organization.tools";
import { SentryService } from "../services/sentry.service";

jest.mock("../services/sentry.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("OrganizationTools", () => {
  let tools: OrganizationTools;
  let mockService: jest.Mocked<SentryService>;

  beforeEach(() => {
    mockService = new SentryService({
      authToken: "fake_token",
      baseUrl: "https://sentry.io",
    }) as jest.Mocked<SentryService>;
    tools = new OrganizationTools(mockService);
  });

  it("should list_organizations and return MCP formatted content", async () => {
    const mockOrgs = [
      { slug: "my-org", name: "My Organization" },
      { slug: "other-org", name: "Other Organization" },
    ];
    mockService.listOrganizations.mockResolvedValue(mockOrgs);

    const result = await tools.list_organizations();

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockOrgs, null, 2) }],
    });
    expect(mockService.listOrganizations).toHaveBeenCalledWith();
  });
});
