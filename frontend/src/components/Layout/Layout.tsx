import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setActiveTab, setOnlineStatus } from '../../store/slices/uiSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

// Components
import Header from './Header';
import Navigation from './Navigation';
import Cart from '../Cart/Cart';
import SearchModal from '../Search/SearchModal';
import FilterModal from '../Filters/FilterModal';
import NotificationContainer from '../UI/NotificationContainer';
import ErrorBoundary from '../UI/ErrorBoundary';

const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { 
    isCartOpen, 
    isSearchOpen, 
    isFilterOpen, 
    isNavigationVisible,
    isOnline 
  } = useSelector((state: RootState) => state.ui);
  
  const { isReady, getViewportHeight } = useTelegramWebApp();

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    let activeTab = 'home';
    
    if (path.startsWith('/products')) activeTab = 'products';
    else if (path.startsWith('/cart')) activeTab = 'cart';
    else if (path.startsWith('/orders')) activeTab = 'orders';
    else if (path.startsWith('/profile')) activeTab = 'profile';
    else if (path.startsWith('/favorites')) activeTab = 'favorites';
    else if (path.startsWith('/search')) activeTab = 'search';
    
    dispatch(setActiveTab(activeTab));
  }, [location.pathname, dispatch]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Set CSS custom properties for Telegram theme
  useEffect(() => {
    if (isReady) {
      const root = document.documentElement;
      const viewportHeight = getViewportHeight();
      
      root.style.setProperty('--tg-viewport-height', `${viewportHeight}px`);
      root.style.setProperty('--tg-viewport-stable-height', `${viewportHeight}px`);
    }
  }, [isReady, getViewportHeight]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-primary flex flex-col">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-warning-500 text-white text-center py-2 text-sm font-medium">
            You are currently offline. Some features may not be available.
          </div>
        )}

        {/* Header */}
        <Header />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation */}
        {isNavigationVisible && <Navigation />}

        {/* Modals and Overlays */}
        {isCartOpen && <Cart />}
        {isSearchOpen && <SearchModal />}
        {isFilterOpen && <FilterModal />}

        {/* Notifications */}
        <NotificationContainer />
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
