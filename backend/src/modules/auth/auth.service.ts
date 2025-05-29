import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'crypto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

export interface TelegramInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<any> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token not configured');
    }

    // Parse init data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Create data check string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Calculate hash
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash
    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    // Check auth date (should be within 24 hours)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 86400) { // 24 hours
      throw new UnauthorizedException('Authentication data is too old');
    }

    // Parse user data
    const userDataString = urlParams.get('user');
    if (!userDataString) {
      throw new UnauthorizedException('User data not found');
    }

    const userData = JSON.parse(userDataString);
    
    // Find or create user
    let user = await this.usersService.findByTelegramId(userData.id);
    
    if (!user) {
      const createUserDto: CreateUserDto = {
        telegramId: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
        isPremium: userData.is_premium || false,
        photoUrl: userData.photo_url,
      };
      
      user = await this.usersService.create(createUserDto);
    } else {
      // Update user activity
      await this.usersService.updateLastActive(userData.id);
    }

    return user;
  }

  async login(user: any) {
    const payload = {
      telegramId: user.telegramId,
      sub: user._id,
      firstName: user.firstName,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        isPremium: user.isPremium,
        preferences: user.preferences,
        cart: user.cart,
        favoriteProducts: user.favoriteProducts,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findByTelegramId(payload.telegramId);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  generateWebAppUrl(botUsername: string, startParam?: string): string {
    const baseUrl = `https://t.me/${botUsername}/app`;
    return startParam ? `${baseUrl}?startapp=${startParam}` : baseUrl;
  }

  validateWebAppData(initData: string): boolean {
    try {
      this.validateTelegramAuth(initData);
      return true;
    } catch {
      return false;
    }
  }
}
