import { AuthService } from './auth.service';
import { TotpService } from './totp.service';
import { getSuperAdminByEmail } from '@/core/db/tenants';
import { verifyPassword } from '@/core/auth';
import { signSuperToken } from '@/core/super_auth';
import { query } from '@/core/db/postgres';

jest.mock('@/core/db/tenants', () => ({
  getSuperAdminByEmail: jest.fn(),
}));
jest.mock('@/core/auth', () => ({
  verifyPassword: jest.fn(),
}));
jest.mock('@/core/super_auth', () => ({
  signSuperToken: jest.fn(),
}));
jest.mock('@/core/db/postgres', () => ({
  query: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let totpService: TotpService;

  beforeEach(() => {
    totpService = { verifyCode: jest.fn() } as any;
    service = new AuthService(totpService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully without 2FA', async () => {
      const mockAdmin = { 
        id: '1', 
        email: 'a@a.com', 
        password_hash: 'hash', 
        name: 'Admin', 
        role: 'OWNER', 
        totp_enabled: false 
      };
      (getSuperAdminByEmail as jest.Mock).mockResolvedValue(mockAdmin);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (signSuperToken as jest.Mock).mockResolvedValue('token123');

      const result = await service.login('a@a.com', 'pass');

      expect(result.status).toBe('SUCCESS');
      expect(result.token).toBe('token123');
    });

    it('should return PENDING_2FA if 2FA is enabled', async () => {
      const mockAdmin = { 
        id: '1', 
        email: 'a@a.com', 
        password_hash: 'hash', 
        name: 'Admin', 
        role: 'OWNER', 
        totp_enabled: true 
      };
      (getSuperAdminByEmail as jest.Mock).mockResolvedValue(mockAdmin);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (signSuperToken as jest.Mock).mockResolvedValue('token_partial');

      const result = await service.login('a@a.com', 'pass');

      expect(result.status).toBe('PENDING_2FA');
    });
  });

  describe('verify2Fa', () => {
    it('should verify code and return full token', async () => {
       (query as jest.Mock).mockResolvedValue([{ id: '1', email: 'a@a.com', role: 'OWNER', totp_secret: 'S1' }]);
       (totpService.verifyCode as jest.Mock).mockResolvedValue(true);
       (signSuperToken as jest.Mock).mockResolvedValue('full_token');

       const result = await service.verify2Fa('1', '123456');

       expect(result.status).toBe('SUCCESS');
       expect(result.token).toBe('full_token');
    });
  });
});
