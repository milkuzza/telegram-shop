import { connect, model } from 'mongoose';
import { Category, CategorySchema } from '../modules/categories/schemas/category.schema';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../../.env') });

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    isActive: true,
    sortOrder: 1,
    productCount: 0
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel',
    isActive: true,
    sortOrder: 2,
    productCount: 0
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books and literature',
    isActive: true,
    sortOrder: 3,
    productCount: 0
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    isActive: true,
    sortOrder: 4,
    productCount: 0
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports equipment and outdoor gear',
    isActive: true,
    sortOrder: 5,
    productCount: 0
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Health and beauty products',
    isActive: true,
    sortOrder: 6,
    productCount: 0
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Toys and games for all ages',
    isActive: true,
    sortOrder: 7,
    productCount: 0
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car parts and accessories',
    isActive: true,
    sortOrder: 8,
    productCount: 0
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-shop';
    await connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create the model
    const CategoryModel = model('Category', CategorySchema);

    // Clear existing categories
    await CategoryModel.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const createdCategories = await CategoryModel.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories:`);

    createdCategories.forEach((category: any) => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('✅ Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
