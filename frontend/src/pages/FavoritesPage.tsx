import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Heart, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback } = useTelegramWebApp();
  
  // For now, we'll use mock data since favorites functionality isn't fully implemented
  const favorites: any[] = [];
  const isLoading = false;

  const handleContinueShopping = () => {
    hapticFeedback.impact('light');
    navigate('/products');
  };

  const handleRemoveFromFavorites = (productId: string) => {
    hapticFeedback.impact('medium');
    // TODO: Implement remove from favorites
    console.log('Remove from favorites:', productId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="bg-white border-b border-telegram-border p-4">
        <h1 className="text-xl font-semibold text-telegram-text">
          My Favorites
        </h1>
        {favorites.length > 0 && (
          <p className="text-sm text-telegram-text-secondary mt-1">
            {favorites.length} item{favorites.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-telegram-text-secondary" />
            </div>
            <h2 className="text-2xl font-semibold text-telegram-text mb-4">
              No favorites yet
            </h2>
            <p className="text-telegram-text-secondary text-center mb-8 max-w-sm">
              Start adding products to your favorites by tapping the heart icon on any product.
            </p>
            <button
              onClick={handleContinueShopping}
              className="btn-primary"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((product) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} viewMode="grid" />
                <button
                  onClick={() => handleRemoveFromFavorites(product._id)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm"
                >
                  <Heart className="w-4 h-4 text-error-500 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
