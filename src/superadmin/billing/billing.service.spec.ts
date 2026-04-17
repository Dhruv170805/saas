import { BillingService } from './billing.service';
import { query } from '@/lib/db/postgres';

jest.mock('@/lib/db/postgres', () => ({
  query: jest.fn(),
}));

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
    jest.clearAllMocks();
  });

  describe('verifyPayment', () => {
    it('should successfully verify a PENDING payment and update subscription', async () => {
      const mockRequest = [{ status: 'PENDING', tenant_id: 't1', plan_id: 'p1', transaction_id: 'trx1' }];
      const mockSub = [{ current_period_end: new Date() }];

      (query as jest.Mock)
        .mockResolvedValueOnce([]) // BEGIN
        .mockResolvedValueOnce(mockRequest) // SELECT payment_request
        .mockResolvedValueOnce([]) // UPDATE payment_request
        .mockResolvedValueOnce(mockSub) // INSERT/UPDATE subscription
        .mockResolvedValueOnce([]) // UPDATE tenant
        .mockResolvedValueOnce([]); // COMMIT

      const result = await service.verifyPayment('req1', 'APPROVED', 'admin1', 'Good');

      expect(result).toEqual({ success: true });
      expect(query).toHaveBeenCalledWith('SYSTEM', expect.stringContaining('UPDATE payment_requests'), expect.anything());
    });

    it('should throw error if payment request is not found or already processed', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce([]) // BEGIN
        .mockResolvedValueOnce([]); // SELECT payment_request (empty)

      await expect(service.verifyPayment('req1', 'APPROVED', 'admin1'))
        .rejects.toThrow('Invalid or already processed request');
    });
  });
});
