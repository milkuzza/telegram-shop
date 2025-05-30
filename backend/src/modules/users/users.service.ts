import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    const savedUser = await user.save();

    // Cache user data
    await this.cacheUser(savedUser);

    return savedUser;
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    // Try to get from cache first
    const cacheKey = `user:telegram:${telegramId}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // If not in cache, get from database
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `user:id:${id}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheUser(user);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update cache
    await this.cacheUser(user);

    return user;
  }

  async updateByTelegramId(
    telegramId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ telegramId }, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update cache
    await this.cacheUser(user);

    return user;
  }

  async updateLastActive(telegramId: number): Promise<void> {
    await this.userModel
      .updateOne({ telegramId }, { lastActiveAt: new Date() })
      .exec();

    // Update cache
    const user = await this.findByTelegramId(telegramId);
    if (user) {
      user.lastActiveAt = new Date();
      await this.cacheUser(user as UserDocument);
    }
  }

  async addToCart(
    telegramId: number,
    productId: string,
    quantity: number,
    selectedVariant?: string,
  ): Promise<User> {
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.cart) {
      user.cart = { items: [], updatedAt: new Date() };
    }

    const existingItem = user.cart.items.find(
      item => item.productId === productId && item.selectedVariant === selectedVariant,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.items.push({ productId, quantity, selectedVariant });
    }

    user.cart.updatedAt = new Date();
    const updatedUser = await user.save();

    // Update cache
    await this.cacheUser(updatedUser);

    return updatedUser;
  }

  async removeFromCart(
    telegramId: number,
    productId: string,
    selectedVariant?: string,
  ): Promise<User> {
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (!user || !user.cart) {
      throw new NotFoundException('User or cart not found');
    }

    user.cart.items = user.cart.items.filter(
      item => !(item.productId === productId && item.selectedVariant === selectedVariant),
    );

    user.cart.updatedAt = new Date();
    const updatedUser = await user.save();

    // Update cache
    await this.cacheUser(updatedUser);

    return updatedUser;
  }

  async clearCart(telegramId: number): Promise<User> {
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.cart = { items: [], updatedAt: new Date() };
    const updatedUser = await user.save();

    // Update cache
    await this.cacheUser(updatedUser);

    return updatedUser;
  }

  async addToFavorites(telegramId: number, productId: string): Promise<User> {
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.favoriteProducts.includes(productId)) {
      user.favoriteProducts.push(productId);
      const updatedUser = await user.save();

      // Update cache
      await this.cacheUser(updatedUser);

      return updatedUser;
    }

    return user;
  }

  async removeFromFavorites(telegramId: number, productId: string): Promise<User> {
    const user = await this.userModel.findOne({ telegramId }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.favoriteProducts = user.favoriteProducts.filter(id => id !== productId);
    const updatedUser = await user.save();

    // Update cache
    await this.cacheUser(updatedUser);

    return updatedUser;
  }

  async getUserStats(): Promise<any> {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$lastActiveAt',
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                  ],
                },
                1,
                0,
              ],
            },
          },
          premiumUsers: { $sum: { $cond: ['$isPremium', 1, 0] } },
          avgTotalSpent: { $avg: '$totalSpent' },
          avgTotalOrders: { $avg: '$totalOrders' },
        },
      },
    ]);

    return stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      premiumUsers: 0,
      avgTotalSpent: 0,
      avgTotalOrders: 0,
    };
  }

  private async cacheUser(user: UserDocument): Promise<void> {
    const cacheKey1 = `user:telegram:${user.telegramId}`;
    const cacheKey2 = `user:id:${user._id}`;
    const userData = JSON.stringify(user.toObject());

    // Cache for 1 hour
    await this.redisService.set(cacheKey1, userData, 3600);
    await this.redisService.set(cacheKey2, userData, 3600);
  }

  async count(): Promise<number> {
    return this.userModel.countDocuments();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-__v').exec();
  }
}
