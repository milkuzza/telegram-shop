import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  async processPayment(@Body() paymentData: any) {
    return this.paymentsService.processPayment(paymentData);
  }

  @Post('verify')
  async verifyPayment(@Body() body: { paymentId: string }) {
    return this.paymentsService.verifyPayment(body.paymentId);
  }
}
