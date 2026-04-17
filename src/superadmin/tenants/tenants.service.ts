import { Injectable, NotFoundException } from '@nestjs/common';
import { query } from '@/lib/db/postgres';
import { BrandingService } from '@/src/common/services/branding.service';

@Injectable()
export class TenantsService {
  constructor(private readonly brandingService: BrandingService) {}

  /**
   * Update tenant branding by extracting a palette from a logo.
   */
  async updateTenantBranding(tenantId: string, logoUrl: string) {
    const palette = await this.brandingService.extractPaletteFromLogo(logoUrl);
    
    const res = await query('SYSTEM', `
      UPDATE tenants 
      SET logo_url = $1, theme = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING id
    `, [logoUrl, JSON.stringify(palette), tenantId]);

    if (!res.length) {
      throw new NotFoundException('Tenant not found');
    }

    return { success: true, theme: palette };
  }
  /**
   * List all tenants in the platform (Global View).
   */
  async listAll() {
    const data = await query<{ id: string, name: string, slug: string, plan: string, suspended: boolean }>(
      'SYSTEM', 
      'SELECT id, name, slug, plan, suspended, created_at FROM tenants ORDER BY created_at DESC'
    );
    return { success: true, data };
  }

  /**
   * Update tenant suspension status.
   */
  async updateSuspension(tenantId: string, suspended: boolean) {
    const res = await query('SYSTEM', 
      'UPDATE tenants SET suspended = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [suspended, tenantId]
    );

    if (!res.length) {
      throw new NotFoundException('Tenant not found');
    }

    return { success: true };
  }
}
