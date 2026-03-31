import { StripeService } from './stripe.service';
import Stripe from 'stripe';

describe('StripeService', () => {
  let service: StripeService;
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = {
      customers: {
        retrieve: jest.fn(),
        list: jest.fn(),
      },
      balance: {
        retrieve: jest.fn(),
      },
    };
    service = new StripeService('fake_key');
    (service as any).stripe = mockStripe;
  });

  it('should retrieve a customer', async () => {
    const mockCustomer = { id: 'cus_123', email: 'test@example.com' };
    mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

    const result = await service.getCustomer('cus_123');
    expect(result).toEqual(mockCustomer);
    expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_123');
  });

  it('should list customers', async () => {
    const mockCustomers = { data: [{ id: 'cus_123' }] };
    mockStripe.customers.list.mockResolvedValue(mockCustomers);

    const result = await service.listCustomers(5);
    expect(result).toEqual(mockCustomers.data);
    expect(mockStripe.customers.list).toHaveBeenCalledWith({ limit: 5 });
  });

  it('should retrieve balance', async () => {
    const mockBalance = { available: [] };
    mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

    const result = await service.getBalance();
    expect(result).toEqual(mockBalance);
  });
});
