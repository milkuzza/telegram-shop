import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { fetchFeaturedProducts } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Star, ArrowRight, ShoppingBag } from 'lucide-react';

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { featuredProducts, isLoadingFeatured } = useSelector((state: RootState) => state.products);
  const { categories, isLoading: isLoadingCategories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { hapticFeedback } = useTelegramWebApp();

  useEffect(() => {
    dispatch(fetchFeaturedProducts(8));
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleProductClick = (productId: string) => {
    hapticFeedback.impact('light');
    navigate(`/products/${productId}`);
  };

  const handleCategoryClick = (categorySlug: string) => {
    hapticFeedback.impact('light');
    navigate(`/category/${categorySlug}`);
  };

  const handleViewAllProducts = () => {
    hapticFeedback.impact('light');
    navigate('/products');
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-telegram-blue to-telegram-blue-dark text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Welcome{user ? `, ${user.firstName}` : ''} to Mezohit Store
          </h1>
          <p className="text-telegram-blue-light opacity-90">
            Discover amazing products at great prices
          </p>
        </div>
      </div>

      {/* Categories Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-telegram-text">Categories</h2>
        </div>
        
        {isLoadingCategories ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {categories.slice(0, 4).map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryClick(category.slug)}
                className="bg-white rounded-lg p-4 border border-telegram-border hover:shadow-card transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-telegram-blue rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-telegram-text text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-telegram-text-secondary">
                      {category.productCount} items
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Featured Products Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-telegram-text">Featured Products</h2>
          <button
            onClick={handleViewAllProducts}
            className="flex items-center text-telegram-blue text-sm font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {isLoadingFeatured ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.slice(0, 4).map((product) => (
              <button
                key={product._id}
                onClick={() => handleProductClick(product._id)}
                className="bg-white rounded-lg border border-telegram-border overflow-hidden hover:shadow-card transition-all duration-200 text-left"
              >
                <div className="aspect-square bg-gray-100 relative">
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
                    <div className="absolute top-2 left-2 bg-error-500 text-white text-xs px-2 py-1 rounded">
                      -{product.discountPercentage}%
                    </div>
                  )}
                </div>
                
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-telegram-text">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-xs text-telegram-text-secondary line-through ml-1">
                          {formatPrice(product.comparePrice, product.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/products')}
            className="bg-telegram-blue text-white rounded-lg p-4 text-center"
          >
            <ShoppingBag className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Browse All Products</span>
          </button>
          
          <button
            onClick={() => navigate('/search')}
            className="bg-white border border-telegram-border rounded-lg p-4 text-center"
          >
            <div className="w-6 h-6 mx-auto mb-2 bg-telegram-blue rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
            <span className="text-sm font-medium text-telegram-text">Search Products</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
