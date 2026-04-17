import { processDebtRecovery } from './debt_recovery';
import { query } from '../../db/postgres';
import { sendWhatsAppMessage } from '../../services/whatsapp';

jest.mock('../../db/postgres', () => ({
  query: jest.fn(),
}));
jest.mock('../../services/whatsapp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

describe('Debt Recovery Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process pending debts and send WhatsApp messages', async () => {
    const mockDebts = [
      { id: 'o1', total: '100', customer_phone: '1234567890', restaurant_name: 'Test Resto', created_at: new Date() }
    ];

    (query as jest.Mock)
      .mockResolvedValueOnce(mockDebts) // SELECT orders
      .mockResolvedValueOnce([]); // UPDATE order

    const result = await processDebtRecovery();

    expect(result.processed).toBe(1);
    expect(sendWhatsAppMessage).toHaveBeenCalledWith('1234567890', expect.stringContaining('Test Resto'));
    expect(query).toHaveBeenCalledWith('SYSTEM', expect.stringContaining('UPDATE orders SET reminder_sent_at'), expect.anything());
  });

  it('should handle empty debt list', async () => {
    (query as jest.Mock).mockResolvedValueOnce([]);

    const result = await processDebtRecovery();

    expect(result.processed).toBe(0);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });
});
