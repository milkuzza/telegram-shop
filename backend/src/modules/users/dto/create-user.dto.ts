import { IsNumber, IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Telegram user ID', example: 123456789 })
  @IsNumber()
  telegramId: number;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Telegram username', example: 'johndoe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'User language code', example: 'en' })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({ description: 'User photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Is user active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is user premium', default: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ 
    description: 'User preferences',
    example: {
      notifications: true,
      language: 'en',
      currency: 'USD'
    }
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    notifications: boolean;
    language: string;
    currency: string;
  };

  @ApiPropertyOptional({
    description: 'Shipping address',
    example: {
      country: 'USA',
      city: 'New York',
      address: '123 Main St',
      postalCode: '10001',
      phone: '+1234567890'
    }
  })
  @IsOptional()
  @IsObject()
  shippingAddress?: {
    country: string;
    city: string;
    address: string;
    postalCode: string;
    phone: string;
  };
}
