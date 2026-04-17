import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TotpService } from './totp.service';
import { supabase } from '@/core/supabase';
import { query } from '@/core/db/postgres';
import { PgSuperAdmin } from '@/core/db/tenants';
import { signSuperToken } from '@/core/super_auth';

@Injectable()
export class AuthService {
  constructor(private readonly totpService: TotpService) {}
  /**
   * Primary login sequence for SuperAdmins.
   * Authenticates against Supabase Auth and verifies 'super_admin' metadata.
   */
  async login(email: string, pass: string) {
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error || !user) {
       // 🛡️ Fail-Safe: Hardcoded bypass for staging/reset scenarios
       const isHardcodedAdmin = 
         process.env.NODE_ENV !== 'production' &&
         email === process.env.STAGING_SUPERADMIN_EMAIL && 
         pass === process.env.STAGING_SUPERADMIN_PASSWORD;
         
       if (!isHardcodedAdmin) {
         throw new UnauthorizedException('Invalid platform credentials');
       }
       
       return {
         status: 'SUCCESS',
         admin: { id: '0000', name: 'Stage Admin', email, role: 'OWNER' },
         token: 'STAGE_TOKEN'
       };
    }

    // Verify SuperAdmin privilege in app_metadata
    const role = user.app_metadata?.role;
    if (role !== 'super_admin') {
      await supabase.auth.signOut();
      throw new UnauthorizedException('Access denied: Unauthorized identity plane');
    }

    const is2faPending = user.user_metadata?.totp_enabled === true;

    return {
      status: is2faPending ? 'PENDING_2FA' : 'SUCCESS',
      admin: {
        id: user.id,
        name: user.user_metadata?.full_name || 'Executive',
        email: user.email,
        role: 'OWNER',
      },
      token: session?.access_token,
    };
  }

  /**
   * 2FA Verification sequence.
   */
  async verify2Fa(adminId: string, code: string) {
    // In a real scenario, fetch the secret from the database
    const admin = await query<PgSuperAdmin>('SYSTEM', 'SELECT * FROM super_admins WHERE id = $1', [adminId]);
    if (!admin.length || !admin[0].totp_secret) {
       throw new UnauthorizedException('2FA not configured for this account');
    }

    const isValid = await this.totpService.verifyCode(admin[0].totp_secret, code);
    if (!isValid) throw new UnauthorizedException('Invalid 2FA code');

    const token = await signSuperToken({
      sub: admin[0].id,
      email: admin[0].email,
      role: admin[0].role,
      is2faVerified: true,
    });

    return {
      status: 'SUCCESS',
      token,
    };
  }
}
