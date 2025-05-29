import React, { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface Category {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Filters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  featured?: boolean;
  tags?: string[];
}

interface ProductFiltersProps {
  filters: Filters;
  categories: Category[];
  onFiltersChange: (filters: Filters) => void;
  onClose: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onFiltersChange,
  onClose,
}) => {
  const { hapticFeedback } = useTelegramWebApp();
  
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    sort: true,
    other: false,
  });

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    hapticFeedback.impact('medium');
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    hapticFeedback.impact('light');
    const clearedFilters: Filters = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    hapticFeedback.impact('light');
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price', label: 'Price Low to High' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'orderCount', label: 'Most Popular' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-telegram-border">
            <h2 className="text-lg font-semibold text-telegram-text flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Category Filter */}
            <div>
              <button
                onClick={() => toggleSection('category')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="font-medium text-telegram-text">Category</h3>
                {expandedSections.category ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.category && (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      checked={!localFilters.category}
                      onChange={() => handleFilterChange('category', undefined)}
                      className="mr-3"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={localFilters.category === category._id}
                        onChange={() => handleFilterChange('category', category._id)}
                        className="mr-3"
                      />
                      <span className="text-sm">
                        {category.name} ({category.productCount})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div>
              <button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="font-medium text-telegram-text">Price Range</h3>
                {expandedSections.price ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.price && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Price</label>
                      <input
                        type="number"
                        value={localFilters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-telegram-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Price</label>
                      <input
                        type="number"
                        value={localFilters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="1000"
                        className="w-full px-3 py-2 border border-telegram-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Quick price ranges */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Under $25', min: 0, max: 25 },
                      { label: '$25 - $50', min: 25, max: 50 },
                      { label: '$50 - $100', min: 50, max: 100 },
                      { label: 'Over $100', min: 100, max: undefined },
                    ].map((range, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleFilterChange('minPrice', range.min);
                          handleFilterChange('maxPrice', range.max);
                        }}
                        className="px-3 py-1 text-xs border border-telegram-border rounded-full hover:bg-gray-50"
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div>
              <button
                onClick={() => toggleSection('sort')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="font-medium text-telegram-text">Sort By</h3>
                {expandedSections.sort ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.sort && (
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={localFilters.sortBy === option.value}
                        onChange={() => {
                          handleFilterChange('sortBy', option.value);
                          // Set appropriate sort order for each option
                          const order = option.value === 'price' ? 'asc' : 'desc';
                          handleFilterChange('sortOrder', order);
                        }}
                        className="mr-3"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Other Filters */}
            <div>
              <button
                onClick={() => toggleSection('other')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="font-medium text-telegram-text">Other</h3>
                {expandedSections.other ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.other && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.featured || false}
                      onChange={(e) => handleFilterChange('featured', e.target.checked || undefined)}
                      className="mr-3"
                    />
                    <span className="text-sm">Featured Products Only</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-telegram-border p-4 space-y-3">
            <div className="flex space-x-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 btn-secondary"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
