import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { fetchProducts, setFilters } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import ProductCard from '../components/Products/ProductCard';
import ProductFilters from '../components/Products/ProductFilters';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Grid3X3, List, Filter, Search } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { products, isLoading, pagination, filters } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { hapticFeedback } = useTelegramWebApp();

  // Get filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const newFilters = {
      category: category || undefined,
      search: search || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    dispatch(setFilters(newFilters));
  }, [searchParams, dispatch]);

  // Fetch data
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };
    console.log('ProductsPage: Fetching products with params:', params);
    dispatch(fetchProducts(params));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  const handleFilterChange = (newFilters: any) => {
    hapticFeedback.impact('light');

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    hapticFeedback.impact('light');
    setViewMode(mode);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      dispatch(fetchProducts({
        ...filters,
        page: pagination.page + 1,
        limit: pagination.limit,
      }));
    }
  };

  const toggleFilters = () => {
    hapticFeedback.impact('light');
    setShowFilters(!showFilters);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Header with controls */}
      <div className="bg-white border-b border-telegram-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-telegram-text">Products</h1>
          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex bg-telegram-bg-secondary rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter button */}
            <button
              onClick={toggleFilters}
              className="p-2 bg-telegram-blue text-white rounded-lg"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-telegram-text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-telegram-border rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
          />
        </div>

        {/* Active filters */}
        {(filters.category || filters.minPrice || filters.maxPrice) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.category && (
              <span className="bg-telegram-blue text-white px-3 py-1 rounded-full text-sm">
                Category: {categories.find(c => c._id === filters.category)?.name}
              </span>
            )}
            {filters.minPrice && (
              <span className="bg-telegram-blue text-white px-3 py-1 rounded-full text-sm">
                Min: ${filters.minPrice}
              </span>
            )}
            {filters.maxPrice && (
              <span className="bg-telegram-blue text-white px-3 py-1 rounded-full text-sm">
                Max: ${filters.maxPrice}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <ProductFilters
          filters={filters}
          categories={categories}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Products grid/list */}
      <div className="p-4">
        {isLoading && products.length === 0 ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-telegram-text-secondary">No products found</p>
          </div>
        ) : (
          <>
            <div className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3'
                : 'space-y-3'
            }`}>
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load more button */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {/* Results info */}
            <div className="text-center mt-4 text-sm text-telegram-text-secondary">
              Showing {products.length} of {pagination.total} products
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
