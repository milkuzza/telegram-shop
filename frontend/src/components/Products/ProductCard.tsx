import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { addToCart } from '../../store/slices/cartSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { Star, ShoppingCart, Heart, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  discountPercentage: number;
  currency: string;
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  images: string[];
  thumbnail?: string;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback } = useTelegramWebApp();

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const handleProductClick = () => {
    hapticFeedback.impact('light');
    navigate(`/products/${product._id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.impact('medium');

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity: 1,
      })).unwrap();
      
      hapticFeedback.notification('success');
      toast.success('Added to cart!');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.impact('light');
    
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      return;
    }

    // TODO: Implement favorites functionality
    toast.success('Added to favorites!');
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleProductClick}
        className="bg-white rounded-lg border border-telegram-border p-4 cursor-pointer hover:shadow-card transition-all duration-200"
      >
        <div className="flex space-x-4">
          {/* Product Image */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
            {product.thumbnail || product.images[0] ? (
              <img
                src={product.thumbnail || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {product.discountPercentage > 0 && (
              <div className="absolute top-1 left-1 bg-error-500 text-white text-xs px-1 py-0.5 rounded">
                -{product.discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-telegram-text mb-1 line-clamp-2">
              {product.name}
            </h3>
            
            <p className="text-sm text-telegram-text-secondary mb-2 line-clamp-2">
              {product.shortDescription || product.description}
            </p>
            
            <div className="flex items-center mb-2">
              <div className="flex items-center mr-3">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-telegram-text-secondary ml-1">
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </div>
              
              {product.stock > 0 ? (
                <span className="text-xs text-success-600">In Stock</span>
              ) : (
                <span className="text-xs text-error-500">Out of Stock</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-telegram-text">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-sm text-telegram-text-secondary line-through ml-2">
                    {formatPrice(product.comparePrice, product.currency)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleFavorite}
                  className="p-1.5 text-telegram-text-secondary hover:text-error-500 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="p-1.5 bg-telegram-blue text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={handleProductClick}
      className="bg-white rounded-lg border border-telegram-border overflow-hidden cursor-pointer hover:shadow-card transition-all duration-200"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.thumbnail || product.images[0] ? (
          <img
            src={product.thumbnail || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Discount Badge */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-error-500 text-white text-xs px-2 py-1 rounded">
            -{product.discountPercentage}%
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm"
        >
          <Heart className="w-4 h-4 text-telegram-text-secondary" />
        </button>
        
        {/* Stock Status */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-medium text-telegram-text text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-telegram-text-secondary ml-1">
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold text-telegram-text">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-telegram-text-secondary line-through">
                {formatPrice(product.comparePrice, product.currency)}
              </div>
            )}
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
