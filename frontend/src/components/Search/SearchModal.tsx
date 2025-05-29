import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { searchProducts, clearSearchResults } from '../../store/slices/productsSlice';
import { addToSearchHistory, setSearchOpen } from '../../store/slices/uiSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { debounce } from 'lodash';

const SearchModal: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { searchResults, isSearching } = useSelector((state: RootState) => state.products);
  const { searchHistory, isSearchOpen } = useSelector((state: RootState) => state.ui);
  const { hapticFeedback } = useTelegramWebApp();
  
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Popular search terms
  const popularSearches = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Books',
    'Beauty',
    'Toys',
    'Automotive',
  ];

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim().length >= 2) {
        dispatch(searchProducts({ query: searchQuery.trim(), limit: 5 }));
      } else {
        dispatch(clearSearchResults());
      }
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const handleClose = () => {
    hapticFeedback.impact('light');
    dispatch(setSearchOpen(false));
    setQuery('');
    dispatch(clearSearchResults());
  };

  const handleSearch = (searchQuery: string) => {
    hapticFeedback.impact('medium');
    
    if (searchQuery.trim().length >= 2) {
      dispatch(addToSearchHistory(searchQuery.trim()));
      dispatch(setSearchOpen(false));
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleProductClick = (productId: string) => {
    hapticFeedback.impact('light');
    dispatch(setSearchOpen(false));
    navigate(`/products/${productId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleSearch(query);
      }
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Search Modal */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Search Header */}
          <div className="p-4 border-b border-telegram-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-telegram-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search products..."
                className="w-full pl-10 pr-10 py-3 border border-telegram-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
              />
              <button
                onClick={handleClose}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X className="w-5 h-5 text-telegram-text-secondary" />
              </button>
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto">
            {query.trim().length === 0 ? (
              /* Initial State */
              <div className="p-4 space-y-6">
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-telegram-text-secondary mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {searchHistory.slice(0, 5).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(item)}
                          className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-lg"
                        >
                          <span className="text-telegram-text">{item}</span>
                          <ArrowRight className="w-4 h-4 text-telegram-text-secondary" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h3 className="text-sm font-medium text-telegram-text-secondary mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Popular Searches
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {popularSearches.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(item)}
                        className="p-3 text-left border border-telegram-border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-telegram-text font-medium">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : query.trim().length < 2 ? (
              /* Query too short */
              <div className="p-4 text-center">
                <p className="text-telegram-text-secondary">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : (
              /* Search Results */
              <div className="p-4">
                {isSearching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-telegram-blue border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-telegram-text-secondary mt-2">Searching...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search All Results */}
                    <button
                      onClick={() => handleSearch(query)}
                      className="w-full flex items-center justify-between p-3 border border-telegram-blue rounded-lg text-telegram-blue hover:bg-blue-50"
                    >
                      <div className="flex items-center">
                        <Search className="w-5 h-5 mr-3" />
                        <span>Search for "{query}"</span>
                      </div>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Product Results */}
                    {searchResults.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-telegram-text-secondary mb-3">
                          Products
                        </h3>
                        <div className="space-y-2">
                          {searchResults.map((product) => (
                            <button
                              key={product._id}
                              onClick={() => handleProductClick(product._id)}
                              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {product.thumbnail || product.images[0] ? (
                                  <img
                                    src={product.thumbnail || product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Search className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-telegram-text text-sm line-clamp-1">
                                  {product.name}
                                </h4>
                                <p className="text-sm text-telegram-text-secondary line-clamp-1">
                                  {product.shortDescription || product.description}
                                </p>
                                <p className="text-sm font-medium text-telegram-blue">
                                  ${product.price}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-8">
                        <p className="text-telegram-text-secondary">
                          No products found for "{query}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
