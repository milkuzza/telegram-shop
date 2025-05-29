import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ email }).exec();
  }

  async create(adminData: Partial<Admin>): Promise<AdminDocument> {
    const admin = new this.adminModel(adminData);
    return admin.save();
  }

  async findAll(): Promise<AdminDocument[]> {
    return this.adminModel.find().exec();
  }

  async findById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }
}
