import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { User, UserSchema } from '../../modules/users/schemas/user.schema';
import { Product, ProductSchema } from '../../modules/products/schemas/product.schema';
import { Category, CategorySchema } from '../../modules/categories/schemas/category.schema';
import { Order, OrderSchema } from '../../modules/orders/schemas/order.schema';
import { Admin, AdminSchema } from '../../modules/admin/schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
