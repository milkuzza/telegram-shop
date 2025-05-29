import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(TelegramAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return {
      message: 'Admin dashboard - coming soon',
      timestamp: new Date(),
    };
  }
}
