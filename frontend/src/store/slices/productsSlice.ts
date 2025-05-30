import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  discountPercentage: number;
  currency: string;
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  images: string[];
  thumbnail?: string;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  variants?: Record<string, any>;
  sku?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  seo?: Record<string, any>;
  viewCount: number;
  orderCount: number;
  rating: number;
  reviewCount: number;
  reviews: Array<{
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  sortOrder: number;
  vendor?: string;
  barcode?: string;
  requiresShipping: boolean;
  isDigital: boolean;
  shipping?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  searchResults: Product[];
  isLoading: boolean;
  isLoadingFeatured: boolean;
  isLoadingCurrent: boolean;
  isLoadingRelated: boolean;
  isSearching: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    featured?: boolean;
    tags?: string[];
  };
}

const initialState: ProductsState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  relatedProducts: [],
  searchResults: [],
  isLoading: false,
  isLoadingFeatured: false,
  isLoadingCurrent: false,
  isLoadingRelated: false,
  isSearching: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      console.log('fetchProducts: API call with params:', params);
      const response = await productsAPI.getProducts(params);
      console.log('fetchProducts: API response:', response);
      return response;
    } catch (error: any) {
      console.error('fetchProducts: API error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getFeaturedProducts(limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getProductById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  'products/fetchRelatedProducts',
  async ({ productId, limit = 5 }: { productId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getRelatedProducts(productId, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch related products');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async ({ query, limit = 20 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      console.log('searchProducts: API call with query:', query, 'limit:', limit);
      const response = await productsAPI.searchProducts(query, limit);
      console.log('searchProducts: API response:', response);
      return response;
    } catch (error: any) {
      console.error('searchProducts: API error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to search products');
    }
  }
);

export const addProductReview = createAsyncThunk(
  'products/addReview',
  async (
    { productId, rating, comment }: { productId: string; rating: number; comment: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await productsAPI.addReview(productId, rating, comment);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action: PayloadAction<Partial<ProductsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch featured products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoadingFeatured = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoadingFeatured = false;
        state.featuredProducts = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoadingFeatured = false;
        state.error = action.payload as string;
      })

      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoadingCurrent = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoadingCurrent = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoadingCurrent = false;
        state.error = action.payload as string;
      })

      // Fetch related products
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.isLoadingRelated = true;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.isLoadingRelated = false;
        state.relatedProducts = action.payload;
      })
      .addCase(fetchRelatedProducts.rejected, (state, action) => {
        state.isLoadingRelated = false;
        state.error = action.payload as string;
      })

      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // Add review
      .addCase(addProductReview.fulfilled, (state, action) => {
        if (state.currentProduct && state.currentProduct._id === action.payload._id) {
          state.currentProduct = action.payload;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearCurrentProduct,
  clearSearchResults,
  clearError,
  setPagination,
} = productsSlice.actions;

export default productsSlice.reducer;
