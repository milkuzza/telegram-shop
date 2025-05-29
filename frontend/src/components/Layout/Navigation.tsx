import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Home, 
  Grid3X3, 
  ShoppingCart, 
  Package, 
  User,
  Heart
} from 'lucide-react';
import { RootState } from '../../store/store';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { clsx } from 'clsx';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
  badge?: number;
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const { hapticFeedback } = useTelegramWebApp();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Grid3X3,
      path: '/products',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      path: '/cart',
      badge: itemCount,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      path: '/orders',
      requiresAuth: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      requiresAuth: true,
    },
  ];

  // Filter nav items based on authentication
  const visibleNavItems = navItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  // Get active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    
    if (path === '/') return 'home';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/cart')) return 'cart';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/favorites')) return 'favorites';
    
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item: NavItem) => {
    hapticFeedback.impact('light');
    
    if (item.requiresAuth && !isAuthenticated) {
      // Redirect to auth or show login modal
      navigate('/auth');
      return;
    }
    
    navigate(item.path);
  };

  return (
    <nav className="bg-white border-t border-telegram-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 tap-target relative transition-colors duration-200',
                isActive 
                  ? 'text-telegram-blue' 
                  : 'text-telegram-text-secondary hover:text-telegram-text'
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon 
                  className={clsx(
                    'w-5 h-5 mb-1',
                    isActive ? 'text-telegram-blue' : 'text-current'
                  )} 
                />
                
                {/* Badge for cart items */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-telegram-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              <span 
                className={clsx(
                  'text-xs font-medium',
                  isActive ? 'text-telegram-blue' : 'text-current'
                )}
              >
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-telegram-blue rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
