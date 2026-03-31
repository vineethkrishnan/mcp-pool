import { CustomerTools } from './customer.tools';
import { StripeService } from '../services/stripe.service';

jest.mock('../services/stripe.service');

describe('CustomerTools', () => {
  let tools: CustomerTools;
  let mockService: jest.Mocked<StripeService>;

  beforeEach(() => {
    mockService = new StripeService('fake_key') as jest.Mocked<StripeService>;
    tools = new CustomerTools(mockService);
  });

  it('should get_customer and return MCP formatted content', async () => {
    const mockCustomer = { id: 'cus_123', email: 'test@example.com' };
    mockService.getCustomer.mockResolvedValue(mockCustomer as any);

    const result = await tools.get_customer({ id: 'cus_123' });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCustomer, null, 2) }],
    });
    expect(mockService.getCustomer).toHaveBeenCalledWith('cus_123');
  });

  it('should list_customers and return MCP formatted content', async () => {
    const mockCustomers = [{ id: 'cus_123' }];
    mockService.listCustomers.mockResolvedValue(mockCustomers as any);

    const result = await tools.list_customers({ limit: 5 });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockCustomers, null, 2) }],
    });
    expect(mockService.listCustomers).toHaveBeenCalledWith(5);
  });
});
