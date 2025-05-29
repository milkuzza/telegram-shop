import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu, ArrowLeft } from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { toggleSearch, toggleCart, toggleMenu } from '../../store/slices/uiSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { activeTab } = useSelector((state: RootState) => state.ui);
  
  const { hapticFeedback, showBackButton, hideBackButton } = useTelegramWebApp();

  // Determine if we should show back button
  const shouldShowBackButton = () => {
    const path = location.pathname;
    return path !== '/' && 
           !path.startsWith('/products') && 
           !path.startsWith('/cart') && 
           !path.startsWith('/orders') && 
           !path.startsWith('/profile');
  };

  // Handle back navigation
  const handleBack = () => {
    hapticFeedback.impact('light');
    navigate(-1);
  };

  // Handle search
  const handleSearch = () => {
    hapticFeedback.impact('light');
    dispatch(toggleSearch());
  };

  // Handle cart
  const handleCart = () => {
    hapticFeedback.impact('light');
    if (isAuthenticated) {
      dispatch(toggleCart());
    } else {
      navigate('/cart');
    }
  };

  // Handle menu
  const handleMenu = () => {
    hapticFeedback.impact('light');
    dispatch(toggleMenu());
  };

  // Get page title
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Mezohit Store';
    if (path.startsWith('/products/')) return 'Product Details';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/category/')) return 'Category';
    if (path.startsWith('/cart')) return 'Shopping Cart';
    if (path.startsWith('/checkout')) return 'Checkout';
    if (path.startsWith('/orders/')) return 'Order Details';
    if (path.startsWith('/orders')) return 'My Orders';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/favorites')) return 'Favorites';
    if (path.startsWith('/search')) return 'Search';
    
    return 'Mezohit Store';
  };

  return (
    <header className="bg-white border-b border-telegram-border sticky top-0 z-50 safe-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center">
          {shouldShowBackButton() ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 tap-target"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-telegram-text" />
            </button>
          ) : (
            <button
              onClick={handleMenu}
              className="p-2 -ml-2 tap-target"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-telegram-text" />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-telegram-text truncate px-4">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-1">
          {/* Search button */}
          <button
            onClick={handleSearch}
            className="p-2 tap-target"
            aria-label="Search products"
          >
            <Search className="w-5 h-5 text-telegram-text" />
          </button>

          {/* Cart button */}
          <button
            onClick={handleCart}
            className="p-2 tap-target relative"
            aria-label={`Shopping cart ${itemCount > 0 ? `(${itemCount} items)` : ''}`}
          >
            <ShoppingCart className="w-5 h-5 text-telegram-text" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-telegram-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
