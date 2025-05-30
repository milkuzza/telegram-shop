import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@ApiTags('admin-dashboard')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    try {
      // Get basic counts
      const totalProducts = await this.productsService.count();
      const totalUsers = await this.usersService.count();
      
      // Mock data for demo - in real app, get from database
      const stats = {
        totalOrders: 156,
        totalUsers: totalUsers || 1234,
        totalProducts: totalProducts || 89,
        totalRevenue: 12450,
        recentOrders: [
          {
            id: 'ORD-001',
            customerName: 'John Doe',
            total: 99.99,
            status: 'completed',
            createdAt: new Date()
          },
          {
            id: 'ORD-002',
            customerName: 'Jane Smith',
            total: 149.99,
            status: 'pending',
            createdAt: new Date()
          },
          {
            id: 'ORD-003',
            customerName: 'Bob Johnson',
            total: 79.99,
            status: 'shipped',
            createdAt: new Date()
          }
        ],
        topProducts: [
          {
            name: 'Wireless Headphones',
            sales: 45,
            revenue: 2250,
            growth: 12.5,
            thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'
          },
          {
            name: 'Smart Watch',
            sales: 32,
            revenue: 6400,
            growth: 8.3,
            thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
          },
          {
            name: 'Premium T-Shirt',
            sales: 28,
            revenue: 560,
            growth: 15.2,
            thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300'
          }
        ]
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        success: false,
        message: 'Failed to get dashboard stats',
        data: {
          totalOrders: 0,
          totalUsers: 0,
          totalProducts: 0,
          totalRevenue: 0,
          recentOrders: [],
          topProducts: []
        }
      };
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getAnalytics() {
    // Mock analytics data for demo
    const analyticsData = {
      revenue: {
        total: 12450,
        change: 12.5,
        chartData: [
          { date: '2024-01-01', amount: 1200 },
          { date: '2024-01-02', amount: 1800 },
          { date: '2024-01-03', amount: 1500 },
          { date: '2024-01-04', amount: 2200 },
          { date: '2024-01-05', amount: 1900 },
          { date: '2024-01-06', amount: 2100 },
          { date: '2024-01-07', amount: 1850 }
        ]
      },
      orders: {
        total: 156,
        change: 8.3,
        chartData: [
          { date: '2024-01-01', count: 15 },
          { date: '2024-01-02', count: 23 },
          { date: '2024-01-03', count: 18 },
          { date: '2024-01-04', count: 28 },
          { date: '2024-01-05', count: 22 },
          { date: '2024-01-06', count: 25 },
          { date: '2024-01-07', count: 25 }
        ]
      },
      users: {
        total: 1234,
        change: 15.2,
        chartData: [
          { date: '2024-01-01', count: 45 },
          { date: '2024-01-02', count: 52 },
          { date: '2024-01-03', count: 38 },
          { date: '2024-01-04', count: 65 },
          { date: '2024-01-05', count: 48 },
          { date: '2024-01-06', count: 58 },
          { date: '2024-01-07', count: 42 }
        ]
      },
      products: {
        total: 89,
        topSelling: [
          { name: 'Wireless Headphones', sales: 45, revenue: 2250 },
          { name: 'Smart Watch', sales: 32, revenue: 6400 },
          { name: 'Phone Case', sales: 28, revenue: 560 },
          { name: 'Bluetooth Speaker', sales: 24, revenue: 1200 },
          { name: 'USB Cable', sales: 22, revenue: 330 }
        ]
      }
    };

    return {
      success: true,
      data: analyticsData
    };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders for admin' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders() {
    // Mock orders data for demo
    const orders = [
      {
        _id: '1',
        orderNumber: 'ORD-001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        items: [
          {
            product: { name: 'Wireless Headphones' },
            quantity: 1,
            price: 99.99
          }
        ],
        total: 99.99,
        status: 'completed',
        createdAt: new Date(),
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA'
        }
      },
      {
        _id: '2',
        orderNumber: 'ORD-002',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        items: [
          {
            product: { name: 'Smart Watch' },
            quantity: 1,
            price: 299.99
          }
        ],
        total: 299.99,
        status: 'pending',
        createdAt: new Date(),
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          country: 'USA'
        }
      }
    ];

    return {
      success: true,
      data: {
        orders,
        totalPages: 1,
        currentPage: 1,
        totalOrders: orders.length
      }
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users for admin' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers() {
    try {
      const users = await this.usersService.findAll();
      return {
        success: true,
        data: {
          users,
          totalPages: 1,
          currentPage: 1,
          totalUsers: users.length
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return {
        success: false,
        message: 'Failed to get users',
        data: {
          users: [],
          totalPages: 0,
          currentPage: 1,
          totalUsers: 0
        }
      };
    }
  }
}
