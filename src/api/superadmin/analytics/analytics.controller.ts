import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminJwtGuard } from '../../common/guards/superadmin-jwt.guard';
import { AnalyticsService } from './analytics.service';
import { query } from '@/core/db/postgres';

/**
 * SuperAdmin Analytics Controller.
 * Provides the "God-Mode" aerial view of the platform's performance.
 * Guarded by mandatory 2FA security validation.
 */
@Controller('superadmin/analytics')
@UseGuards(SuperAdminJwtGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
  
  @Get()
  async getGlobalStats() {
    return this.analyticsService.getPlatformMetrics();
  }
}
