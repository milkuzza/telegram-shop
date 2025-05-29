import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const initData = req.headers['x-telegram-init-data'] || req.body.initData;
    
    if (!initData) {
      return null;
    }

    return this.authService.validateTelegramAuth(initData);
  }
}
