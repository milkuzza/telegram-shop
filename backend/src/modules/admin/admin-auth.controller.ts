import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    // For demo purposes, we'll use hardcoded credentials
    // In production, you should store hashed passwords in database
    const demoCredentials = {
      email: 'admin@demo.com',
      password: 'admin123'
    };

    if (email !== demoCredentials.email || password !== demoCredentials.password) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Create admin user object
    const admin = {
      id: '1',
      email: demoCredentials.email,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: ['all']
    };

    // Generate JWT token
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h'
    });

    return {
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // In a real application, you might want to blacklist the token
    return {
      success: true,
      message: 'Logout successful'
    };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify admin token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyToken(@Body() body: { token: string }) {
    try {
      const decoded = this.jwtService.verify(body.token);

      if (decoded.type !== 'admin') {
        throw new HttpException('Invalid token type', HttpStatus.UNAUTHORIZED);
      }

      return {
        success: true,
        admin: {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role
        }
      };
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }
}
