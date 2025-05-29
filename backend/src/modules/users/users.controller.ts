import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('profile')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return this.usersService.findByTelegramId(req.user.telegramId);
  }

  @Patch('profile')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateByTelegramId(req.user.telegramId, updateUserDto);
  }

  @Post('cart/add')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ status: 200, description: 'Product added to cart successfully' })
  addToCart(
    @Request() req,
    @Body() body: { productId: string; quantity: number; selectedVariant?: string },
  ) {
    return this.usersService.addToCart(
      req.user.telegramId,
      body.productId,
      body.quantity,
      body.selectedVariant,
    );
  }

  @Post('cart/remove')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product from cart' })
  @ApiResponse({ status: 200, description: 'Product removed from cart successfully' })
  removeFromCart(
    @Request() req,
    @Body() body: { productId: string; selectedVariant?: string },
  ) {
    return this.usersService.removeFromCart(
      req.user.telegramId,
      body.productId,
      body.selectedVariant,
    );
  }

  @Post('cart/clear')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear user cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  clearCart(@Request() req) {
    return this.usersService.clearCart(req.user.telegramId);
  }

  @Post('favorites/add/:productId')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({ status: 200, description: 'Product added to favorites successfully' })
  addToFavorites(@Request() req, @Param('productId') productId: string) {
    return this.usersService.addToFavorites(req.user.telegramId, productId);
  }

  @Post('favorites/remove/:productId')
  @UseGuards(TelegramAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiResponse({ status: 200, description: 'Product removed from favorites successfully' })
  removeFromFavorites(@Request() req, @Param('productId') productId: string) {
    return this.usersService.removeFromFavorites(req.user.telegramId, productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
