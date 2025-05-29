import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Navigation
  activeTab: string;
  isNavigationVisible: boolean;
  
  // Modals and overlays
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;
  isMenuOpen: boolean;
  
  // Loading states
  isAppLoading: boolean;
  isPageLoading: boolean;
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'light' | 'dark';
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: number;
  }>;
  
  // Search
  searchQuery: string;
  searchHistory: string[];
  
  // Filters
  activeFilters: Record<string, any>;
  
  // Layout
  viewMode: 'grid' | 'list';
  itemsPerPage: number;
  
  // Network status
  isOnline: boolean;
  
  // Error handling
  globalError: string | null;
  
  // Telegram specific
  hapticFeedbackEnabled: boolean;
  mainButtonConfig: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    color?: string;
  };
  backButtonVisible: boolean;
}

const initialState: UIState = {
  // Navigation
  activeTab: 'home',
  isNavigationVisible: true,
  
  // Modals and overlays
  isCartOpen: false,
  isSearchOpen: false,
  isFilterOpen: false,
  isMenuOpen: false,
  
  // Loading states
  isAppLoading: true,
  isPageLoading: false,
  
  // Theme and appearance
  theme: 'auto',
  colorScheme: 'light',
  
  // Notifications
  notifications: [],
  
  // Search
  searchQuery: '',
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  
  // Filters
  activeFilters: {},
  
  // Layout
  viewMode: 'grid',
  itemsPerPage: 20,
  
  // Network status
  isOnline: navigator.onLine,
  
  // Error handling
  globalError: null,
  
  // Telegram specific
  hapticFeedbackEnabled: true,
  mainButtonConfig: {
    text: '',
    isVisible: false,
    isActive: true,
  },
  backButtonVisible: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setNavigationVisible: (state, action: PayloadAction<boolean>) => {
      state.isNavigationVisible = action.payload;
    },
    
    // Modals and overlays
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload;
    },
    toggleFilter: (state) => {
      state.isFilterOpen = !state.isFilterOpen;
    },
    setFilterOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterOpen = action.payload;
    },
    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    setMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMenuOpen = action.payload;
    },
    
    // Loading states
    setAppLoading: (state, action: PayloadAction<boolean>) => {
      state.isAppLoading = action.payload;
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload;
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setColorScheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.colorScheme = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory.unshift(query);
        state.searchHistory = state.searchHistory.slice(0, 10); // Keep only last 10 searches
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
      localStorage.removeItem('searchHistory');
    },
    
    // Filters
    setActiveFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.activeFilters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.activeFilters[action.payload.key] = action.payload.value;
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Layout
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
    
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    // Error handling
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Telegram specific
    setHapticFeedbackEnabled: (state, action: PayloadAction<boolean>) => {
      state.hapticFeedbackEnabled = action.payload;
    },
    setMainButtonConfig: (state, action: PayloadAction<Partial<UIState['mainButtonConfig']>>) => {
      state.mainButtonConfig = { ...state.mainButtonConfig, ...action.payload };
    },
    setBackButtonVisible: (state, action: PayloadAction<boolean>) => {
      state.backButtonVisible = action.payload;
    },
    
    // Close all modals
    closeAllModals: (state) => {
      state.isCartOpen = false;
      state.isSearchOpen = false;
      state.isFilterOpen = false;
      state.isMenuOpen = false;
    },
  },
});

export const {
  // Navigation
  setActiveTab,
  setNavigationVisible,
  
  // Modals and overlays
  toggleCart,
  setCartOpen,
  toggleSearch,
  setSearchOpen,
  toggleFilter,
  setFilterOpen,
  toggleMenu,
  setMenuOpen,
  
  // Loading states
  setAppLoading,
  setPageLoading,
  
  // Theme and appearance
  setTheme,
  setColorScheme,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Search
  setSearchQuery,
  addToSearchHistory,
  clearSearchHistory,
  
  // Filters
  setActiveFilters,
  updateFilter,
  removeFilter,
  clearFilters,
  
  // Layout
  setViewMode,
  setItemsPerPage,
  
  // Network status
  setOnlineStatus,
  
  // Error handling
  setGlobalError,
  clearGlobalError,
  
  // Telegram specific
  setHapticFeedbackEnabled,
  setMainButtonConfig,
  setBackButtonVisible,
  
  // Close all modals
  closeAllModals,
} = uiSlice.actions;

export default uiSlice.reducer;
