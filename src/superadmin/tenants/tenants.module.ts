import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { BrandingService } from '@/src/common/services/branding.service';

/**
 * SuperAdmin Tenants Domain.
 * Manages the global multi-tenant fleet registry.
 */
@Module({
  controllers: [TenantsController],
  providers: [TenantsService, BrandingService],
})
export class TenantsModule {}
