import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private redisService: RedisService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if slug already exists
    const existingCategory = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    const category = new this.categoryModel(createCategoryDto);
    const savedCategory = await category.save();
    
    // Clear cache
    await this.clearCategoryCache();
    
    return savedCategory;
  }

  async findAll(): Promise<Category[]> {
    const cacheKey = 'categories:all';
    const cachedCategories = await this.redisService.get(cacheKey);
    
    if (cachedCategories) {
      return JSON.parse(cachedCategories);
    }

    const categories = await this.categoryModel
      .find({ isActive: true })
      .populate('parentId', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(categories), 3600);

    return categories;
  }

  async findTree(): Promise<any[]> {
    const cacheKey = 'categories:tree';
    const cachedTree = await this.redisService.get(cacheKey);
    
    if (cachedTree) {
      return JSON.parse(cachedTree);
    }

    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    // Build tree structure
    const categoryMap = new Map();
    const tree: any[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category._id.toString(), {
        ...category.toObject(),
        children: [],
      });
    });

    // Second pass: build tree
    categories.forEach(category => {
      const categoryObj = categoryMap.get(category._id.toString());
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId.toString());
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        tree.push(categoryObj);
      }
    });

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(tree), 3600);

    return tree;
  }

  async findOne(id: string): Promise<Category> {
    const cacheKey = `category:${id}`;
    const cachedCategory = await this.redisService.get(cacheKey);
    
    if (cachedCategory) {
      return JSON.parse(cachedCategory);
    }

    const category = await this.categoryModel
      .findById(id)
      .populate('parentId', 'name slug')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(category), 3600);

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const cacheKey = `category:slug:${slug}`;
    const cachedCategory = await this.redisService.get(cacheKey);
    
    if (cachedCategory) {
      return JSON.parse(cachedCategory);
    }

    const category = await this.categoryModel
      .findOne({ slug, isActive: true })
      .populate('parentId', 'name slug')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(category), 3600);

    return category;
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const cacheKey = `category:children:${parentId}`;
    const cachedChildren = await this.redisService.get(cacheKey);
    
    if (cachedChildren) {
      return JSON.parse(cachedChildren);
    }

    const children = await this.categoryModel
      .find({ parentId: new Types.ObjectId(parentId), isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    // Cache for 1 hour
    await this.redisService.set(cacheKey, JSON.stringify(children), 3600);

    return children;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Check if slug already exists (if slug is being updated)
    if (updateCategoryDto.slug) {
      const existingCategory = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .populate('parentId', 'name slug')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Clear cache
    await this.clearCategoryCache();
    await this.redisService.del(`category:${id}`);

    return category;
  }

  async remove(id: string): Promise<void> {
    // Check if category has children
    const children = await this.categoryModel.find({ parentId: new Types.ObjectId(id) });
    
    if (children.length > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    // Check if category has products (you might want to implement this check)
    // const productCount = await this.productModel.countDocuments({ categoryId: new Types.ObjectId(id) });
    // if (productCount > 0) {
    //   throw new ConflictException('Cannot delete category with products');
    // }

    const result = await this.categoryModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException('Category not found');
    }

    // Clear cache
    await this.clearCategoryCache();
    await this.redisService.del(`category:${id}`);
  }

  async getCategoryStats(): Promise<any> {
    const stats = await this.categoryModel.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: { $sum: { $cond: ['$isActive', 1, 0] } },
          rootCategories: {
            $sum: { $cond: [{ $eq: ['$parentId', null] }, 1, 0] },
          },
          avgProductCount: { $avg: '$productCount' },
          totalProducts: { $sum: '$productCount' },
        },
      },
    ]);

    return stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      rootCategories: 0,
      avgProductCount: 0,
      totalProducts: 0,
    };
  }

  private async clearCategoryCache(): Promise<void> {
    const keys = await this.redisService.keys('categories:*');
    const categoryKeys = await this.redisService.keys('category:*');
    const allKeys = [...keys, ...categoryKeys];
    
    if (allKeys.length > 0) {
      await Promise.all(allKeys.map(key => this.redisService.del(key)));
    }
  }
}
