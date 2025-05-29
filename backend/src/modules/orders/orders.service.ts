import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private redisService: RedisService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    // Generate order number
    const orderNumber = await this.generateOrderNumber();
    
    // Validate products and calculate totals
    const validatedItems = await this.validateOrderItems(createOrderDto.items);
    const calculatedTotals = this.calculateOrderTotals(validatedItems, createOrderDto);
    
    // Create order
    const order = new this.orderModel({
      ...createOrderDto,
      orderNumber,
      userId: new Types.ObjectId(userId),
      items: validatedItems,
      ...calculatedTotals,
      statusHistory: [{
        status: OrderStatus.PENDING,
        timestamp: new Date(),
        note: 'Order created',
      }],
    });

    const savedOrder = await order.save();
    
    // Update product order counts
    await this.updateProductOrderCounts(validatedItems);
    
    // Clear user's cart
    await this.userModel.updateOne(
      { _id: userId },
      { $unset: { cart: 1 } }
    );
    
    return savedOrder.populate('userId', 'telegramId firstName lastName');
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'telegramId firstName lastName')
        .exec(),
      this.orderModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .populate('userId', 'telegramId firstName lastName')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate('userId', 'telegramId firstName lastName')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Add status to history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
    });

    order.status = status;

    // Set specific timestamps
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      if (note) {
        order.cancelReason = note;
      }
    }

    const updatedOrder = await order.save();
    return updatedOrder.populate('userId', 'telegramId firstName lastName');
  }

  async cancel(id: string, userId: string, reason?: string): Promise<Order> {
    const order = await this.orderModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    return this.updateStatus(id, OrderStatus.CANCELLED, reason);
  }

  async getOrderStats(userId?: string): Promise<any> {
    const matchStage = userId 
      ? { userId: new Types.ObjectId(userId) }
      : {};

    const stats = await this.orderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get daily counter from Redis
    const counterKey = `order_counter:${year}${month}${day}`;
    const counter = await this.redisService.incr(counterKey);
    
    // Set expiry for the counter (2 days)
    await this.redisService.expire(counterKey, 172800);
    
    return `${year}${month}${day}${counter.toString().padStart(4, '0')}`;
  }

  private async validateOrderItems(items: any[]): Promise<any[]> {
    const validatedItems = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId);
      
      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${item.productId} not found or inactive`);
      }

      if (product.trackStock && product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant,
        thumbnail: product.thumbnail || product.images[0],
      });

      // Update product stock
      if (product.trackStock) {
        await this.productModel.updateOne(
          { _id: product._id },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    return validatedItems;
  }

  private calculateOrderTotals(items: any[], orderData: any) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const shippingCost = orderData.shippingCost || 0;
    const taxAmount = orderData.taxAmount || subtotal * 0.08; // 8% tax
    const discountAmount = orderData.discountAmount || 0;
    
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    return {
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
    };
  }

  private async updateProductOrderCounts(items: any[]): Promise<void> {
    const updates = items.map(item =>
      this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { orderCount: item.quantity } }
      )
    );

    await Promise.all(updates);
  }
}
