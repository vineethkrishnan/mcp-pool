import { CompanyTools } from "./company.tools";
import { HubSpotService } from "../services/hubspot.service";

jest.mock("../services/hubspot.service");
jest.mock("../common/utils", () => ({
  formatMcpResponse: (data: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }),
}));

describe("CompanyTools", () => {
  let tools: CompanyTools;
  let mockService: jest.Mocked<HubSpotService>;

  beforeEach(() => {
    mockService = new HubSpotService({
      accessToken: "fake_token",
    }) as jest.Mocked<HubSpotService>;
    tools = new CompanyTools(mockService);
  });

  // ===========================================================================
  // list_companies
  // ===========================================================================

  it("should list_companies with default parameters", async () => {
    const mockData = { results: [{ id: "1", properties: { name: "Acme Corp" } }] };
    mockService.listCompanies.mockResolvedValue(mockData);

    const result = await tools.list_companies({ limit: 10 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listCompanies).toHaveBeenCalledWith(10, undefined, undefined);
  });

  it("should list_companies with all parameters", async () => {
    const mockData = { results: [] };
    mockService.listCompanies.mockResolvedValue(mockData);

    const result = await tools.list_companies({
      limit: 25,
      properties: ["name", "domain"],
      after: "page2",
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockData, null, 2) }],
    });
    expect(mockService.listCompanies).toHaveBeenCalledWith(25, ["name", "domain"], "page2");
  });

  // ===========================================================================
  // get_company
  // ===========================================================================

  it("should get_company with only required parameters", async () => {
    const mockCompany = { id: "111", properties: { name: "Acme Corp", domain: "acme.com" } };
    mockService.getCompany.mockResolvedValue(mockCompany);

    const result = await tools.get_company({ company_id: "111" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCompany, null, 2) }],
    });
    expect(mockService.getCompany).toHaveBeenCalledWith("111", undefined, undefined);
  });

  it("should get_company with properties and associations", async () => {
    const mockCompany = { id: "222", properties: { name: "Globex" } };
    mockService.getCompany.mockResolvedValue(mockCompany);

    const result = await tools.get_company({
      company_id: "222",
      properties: ["name", "industry"],
      associations: ["contacts", "deals"],
    });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCompany, null, 2) }],
    });
    expect(mockService.getCompany).toHaveBeenCalledWith(
      "222",
      ["name", "industry"],
      ["contacts", "deals"],
    );
  });
});
