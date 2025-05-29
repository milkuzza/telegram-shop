import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Body() update: any) {
    await this.telegramService.handleWebhook(update);
    return { ok: true };
  }

  @Post('set-webhook')
  @ApiOperation({ summary: 'Set Telegram webhook URL' })
  @ApiResponse({ status: 200, description: 'Webhook set successfully' })
  async setWebhook(@Body() body: { url?: string }) {
    return this.telegramService.setWebhook(body.url);
  }

  @Get('webhook-info')
  @ApiOperation({ summary: 'Get webhook information' })
  @ApiResponse({ status: 200, description: 'Webhook info retrieved successfully' })
  async getWebhookInfo() {
    return this.telegramService.getWebhookInfo();
  }

  @Post('delete-webhook')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  async deleteWebhook() {
    return this.telegramService.deleteWebhook();
  }

  @Post('send-message')
  @ApiOperation({ summary: 'Send message to user' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(@Body() body: { chatId: number; message: string; options?: any }) {
    return this.telegramService.sendMessage(body.chatId, body.message, body.options);
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Body() body: { userId: string; notification: any }) {
    // This would integrate with your user service to get the chat ID
    // For now, we'll assume the notification contains the chat ID
    const { chatId, message } = body.notification;
    return this.telegramService.sendMessage(chatId, message);
  }
}
