import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, unique: true })
  telegramId: number;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  username?: string;

  @Prop()
  languageCode?: string;

  @Prop()
  photoUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ type: Object })
  preferences?: {
    notifications: boolean;
    language: string;
    currency: string;
  };

  @Prop({ type: [String], default: [] })
  favoriteProducts: string[];

  @Prop({ type: Object })
  shippingAddress?: {
    country: string;
    city: string;
    address: string;
    postalCode: string;
    phone: string;
  };

  @Prop({ type: Object })
  cart?: {
    items: Array<{
      productId: string;
      quantity: number;
      selectedVariant?: string;
    }>;
    updatedAt: Date;
  };

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better performance
UserSchema.index({ telegramId: 1 }, { unique: true });
UserSchema.index({ username: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ lastActiveAt: -1 });
UserSchema.index({ totalOrders: -1 });
UserSchema.index({ totalSpent: -1 });
