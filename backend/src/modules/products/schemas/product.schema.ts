import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
  collection: 'products',
})
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  comparePrice?: number; // Original price for discounts

  @Prop({ default: 0 })
  discountPercentage: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  thumbnail?: string;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: true })
  trackStock: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  variants?: {
    [key: string]: {
      name: string;
      options: Array<{
        value: string;
        price?: number;
        stock?: number;
        sku?: string;
      }>;
    };
  };

  @Prop()
  sku?: string;

  @Prop()
  weight?: number;

  @Prop({ type: Object })
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };

  @Prop({ type: Object })
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ type: [Object], default: [] })
  reviews: Array<{
    userId: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop()
  vendor?: string;

  @Prop()
  barcode?: string;

  @Prop({ default: false })
  requiresShipping: boolean;

  @Prop({ default: false })
  isDigital: boolean;

  @Prop({ type: Object })
  shipping?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass: string;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Generate slug from name before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  }
  next();
});

// Indexes for better performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ orderCount: -1 });
ProductSchema.index({ viewCount: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ sortOrder: 1 });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
