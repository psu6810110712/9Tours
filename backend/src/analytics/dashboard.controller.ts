import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService, DashboardFilters } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
    @Query('tourType') tourType?: string,
  ) {
    const filters: DashboardFilters = { startDate, endDate, region, tourType };
    return this.dashboardService.getDashboardData(filters);
  }
}