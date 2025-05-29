import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Authenticate with Telegram Web App data' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid authentication data' })
  async telegramAuth(@Body() body: { initData: string }) {
    const user = await this.authService.validateTelegramAuth(body.initData);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req) {
    return {
      user: {
        id: req.user._id,
        telegramId: req.user.telegramId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
        photoUrl: req.user.photoUrl,
        isPremium: req.user.isPremium,
        preferences: req.user.preferences,
        cart: req.user.cart,
        favoriteProducts: req.user.favoriteProducts,
        lastActiveAt: req.user.lastActiveAt,
      },
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate authentication token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Body() body: { token: string }) {
    const user = await this.authService.validateToken(body.token);
    return { valid: true, user: user.telegramId };
  }

  @Get('webapp-url')
  @ApiOperation({ summary: 'Generate Web App URL' })
  @ApiResponse({ status: 200, description: 'Web App URL generated successfully' })
  generateWebAppUrl(@Body() body?: { startParam?: string }) {
    const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      throw new Error('Bot username not configured');
    }
    
    const url = this.authService.generateWebAppUrl(botUsername, body?.startParam);
    return { url };
  }
}
