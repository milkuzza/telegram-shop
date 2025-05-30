import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private redisService: RedisService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    const savedProduct = await product.save();

    // Update category product count
    await this.updateCategoryProductCount(new Types.ObjectId(createProductDto.categoryId));

    // Clear cache
    await this.clearProductCache();
    await this.clearCategoryCache();

    return savedProduct;
  }

  async findAll(query: ProductQueryDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      tags,
    } = query;

    // Build cache key
    const cacheKey = `products:${JSON.stringify(query)}`;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Build filter
    const filter: any = { isActive: true };

    if (category) {
      filter.categoryId = new Types.ObjectId(category);
      console.log('Filtering by category:', category, 'ObjectId:', filter.categoryId);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    const result = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache for 5 minutes
    await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cachedProduct = await this.redisService.get(cacheKey);

    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.updateOne(
      { _id: id },
      { $inc: { viewCount: 1 } }
    );

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(product), 3600);

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const oldProduct = await this.productModel.findById(id);

    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update category counts if category changed
    if (oldProduct && 'categoryId' in updateProductDto && updateProductDto.categoryId &&
        oldProduct.categoryId.toString() !== updateProductDto.categoryId.toString()) {
      await this.updateCategoryProductCount(oldProduct.categoryId);
      await this.updateCategoryProductCount(
        typeof updateProductDto.categoryId === 'string'
          ? new Types.ObjectId(updateProductDto.categoryId)
          : updateProductDto.categoryId as Types.ObjectId
      );
    } else if (oldProduct) {
      await this.updateCategoryProductCount(oldProduct.categoryId);
    }

    // Clear cache
    await this.clearProductCache();
    await this.clearCategoryCache();
    await this.redisService.del(`product:${id}`);

    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productModel.findByIdAndDelete(id);

    // Update category product count
    await this.updateCategoryProductCount(product.categoryId);

    // Clear cache
    await this.clearProductCache();
    await this.clearCategoryCache();
    await this.redisService.del(`product:${id}`);
  }

  async getFeatured(limit: number = 10): Promise<Product[]> {
    const cacheKey = `products:featured:${limit}`;
    const cachedProducts = await this.redisService.get(cacheKey);

    if (cachedProducts) {
      return JSON.parse(cachedProducts);
    }

    const products = await this.productModel
      .find({ isActive: true, isFeatured: true })
      .populate('categoryId', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .exec();

    // Cache for 30 minutes
    await this.redisService.set(cacheKey, JSON.stringify(products), 1800);

    return products;
  }

  async getRelated(productId: string, limit: number = 5): Promise<Product[]> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      return [];
    }

    const relatedProducts = await this.productModel
      .find({
        _id: { $ne: productId },
        categoryId: product.categoryId,
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .sort({ orderCount: -1, rating: -1 })
      .limit(limit)
      .exec();

    return relatedProducts;
  }

  async search(query: string, limit: number = 20): Promise<Product[]> {
    const cacheKey = `products:search:${query}:${limit}`;
    const cachedResults = await this.redisService.get(cacheKey);

    if (cachedResults) {
      return JSON.parse(cachedResults);
    }

    const products = await this.productModel
      .find({
        $text: { $search: query },
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();

    // Cache for 10 minutes
    await this.redisService.set(cacheKey, JSON.stringify(products), 600);

    return products;
  }

  async addReview(
    productId: string,
    userId: string,
    rating: number,
    comment: string,
  ): Promise<Product> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Remove existing review from same user
    product.reviews = product.reviews.filter(
      review => review.userId.toString() !== userId,
    );

    // Add new review
    product.reviews.push({
      userId: new Types.ObjectId(userId),
      rating,
      comment,
      createdAt: new Date(),
    });

    // Recalculate rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating = totalRating / product.reviews.length;
    product.reviewCount = product.reviews.length;

    const updatedProduct = await product.save();

    // Clear cache
    await this.redisService.del(`product:${productId}`);

    return updatedProduct;
  }

  async getProductStats(): Promise<any> {
    const stats = await this.productModel.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          featuredProducts: { $sum: { $cond: ['$isFeatured', 1, 0] } },
          avgPrice: { $avg: '$price' },
          totalViews: { $sum: '$viewCount' },
          totalOrders: { $sum: '$orderCount' },
        },
      },
    ]);

    return stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      featuredProducts: 0,
      avgPrice: 0,
      totalViews: 0,
      totalOrders: 0,
    };
  }

  private async updateCategoryProductCount(categoryId: Types.ObjectId): Promise<void> {
    const count = await this.productModel.countDocuments({
      categoryId,
      isActive: true,
    });

    await this.categoryModel.updateOne(
      { _id: categoryId },
      { productCount: count },
    );
  }

  private async clearProductCache(): Promise<void> {
    const keys = await this.redisService.keys('products:*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.redisService.del(key)));
    }
  }

  private async clearCategoryCache(): Promise<void> {
    const keys = await this.redisService.keys('categories:*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.redisService.del(key)));
    }
  }

  async count(): Promise<number> {
    return this.productModel.countDocuments();
  }
}
