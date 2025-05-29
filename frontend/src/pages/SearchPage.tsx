import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { searchProducts, clearSearchResults } from '../store/slices/productsSlice';
import { addToSearchHistory } from '../store/slices/uiSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { debounce } from 'lodash';

const SearchPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { searchResults, isSearching } = useSelector((state: RootState) => state.products);
  const { searchHistory } = useSelector((state: RootState) => state.ui);
  const { hapticFeedback } = useTelegramWebApp();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popular search terms (could be fetched from API)
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
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim().length >= 2) {
        dispatch(searchProducts({ query: searchQuery.trim() }));
        setSearchParams({ q: searchQuery.trim() });
      } else {
        dispatch(clearSearchResults());
        setSearchParams({});
      }
    }, 300),
    [dispatch, setSearchParams]
  );

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      dispatch(searchProducts({ query: initialQuery }));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearch = (searchQuery: string) => {
    hapticFeedback.impact('light');
    
    if (searchQuery.trim().length >= 2) {
      setQuery(searchQuery);
      setShowSuggestions(false);
      dispatch(addToSearchHistory(searchQuery.trim()));
      dispatch(searchProducts({ query: searchQuery.trim() }));
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleClearQuery = () => {
    hapticFeedback.impact('light');
    setQuery('');
    setShowSuggestions(false);
    dispatch(clearSearchResults());
    setSearchParams({});
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleFocus = () => {
    setShowSuggestions(query.length > 0);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Search Header */}
      <div className="bg-white border-b border-telegram-border p-4 sticky top-0 z-10">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-telegram-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search products..."
              className="w-full pl-10 pr-10 py-3 border border-telegram-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X className="w-4 h-4 text-telegram-text-secondary" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-telegram-border rounded-lg mt-1 shadow-lg z-20">
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="p-3 border-b border-telegram-border">
                  <h3 className="text-sm font-medium text-telegram-text-secondary mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {searchHistory.slice(0, 5).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(item)}
                        className="block w-full text-left px-2 py-1 text-sm text-telegram-text hover:bg-gray-50 rounded"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-telegram-text-secondary mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Popular Searches
                </h3>
                <div className="space-y-1">
                  {popularSearches
                    .filter(item => 
                      item.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(item)}
                        className="block w-full text-left px-2 py-1 text-sm text-telegram-text hover:bg-gray-50 rounded"
                      >
                        {item}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4">
        {isSearching ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : query.trim().length === 0 ? (
          /* Initial State */
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-telegram-text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-telegram-text mb-4">
              Search Products
            </h2>
            <p className="text-telegram-text-secondary mb-8">
              Find exactly what you're looking for from thousands of products
            </p>

            {/* Popular Categories */}
            <div className="text-left">
              <h3 className="font-medium text-telegram-text mb-4">Popular Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                {popularSearches.slice(0, 6).map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(category)}
                    className="p-3 border border-telegram-border rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-telegram-text">{category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : query.trim().length < 2 ? (
          /* Query too short */
          <div className="text-center py-8">
            <p className="text-telegram-text-secondary">
              Please enter at least 2 characters to search
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          /* No results */
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-telegram-text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-telegram-text mb-4">
              No results found
            </h2>
            <p className="text-telegram-text-secondary mb-8">
              We couldn't find any products matching "{query}"
            </p>
            
            <div className="text-left">
              <h3 className="font-medium text-telegram-text mb-4">Try searching for:</h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="px-3 py-1 bg-telegram-blue text-white rounded-full text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-telegram-text">
                Search Results
              </h2>
              <span className="text-sm text-telegram-text-secondary">
                {searchResults.length} products found
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  viewMode="grid"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
