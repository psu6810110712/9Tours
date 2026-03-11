import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserContactMaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(UserContactMaintenanceService.name);

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    try {
      await this.usersService.normalizeStoredPhones();
    } catch (error) {
      this.logger.error('Failed to normalize stored customer phones on startup', error as Error);
    }
  }
}
