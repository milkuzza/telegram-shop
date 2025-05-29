import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check for Authorization header with Bearer token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const user = await this.authService.validateToken(token);
        request.user = user;
        return true;
      } catch (error) {
        // Continue to check Telegram init data
      }
    }

    // Check for Telegram init data in headers
    const telegramInitData = request.headers['x-telegram-init-data'];
    if (telegramInitData) {
      try {
        const user = await this.authService.validateTelegramAuth(telegramInitData);
        request.user = user;
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid Telegram authentication');
      }
    }

    // Check for init data in body (for POST requests)
    if (request.body && request.body.initData) {
      try {
        const user = await this.authService.validateTelegramAuth(request.body.initData);
        request.user = user;
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid Telegram authentication');
      }
    }

    throw new UnauthorizedException('No valid authentication found');
  }
}
