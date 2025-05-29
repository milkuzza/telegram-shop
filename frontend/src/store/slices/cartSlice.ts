import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariant?: string;
  thumbnail?: string;
  maxQuantity?: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  total: number;
  itemCount: number;
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
  total: 0,
  itemCount: 0,
  isOpen: false,
};

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Async thunks
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (
    { productId, quantity, selectedVariant }: 
    { productId: string; quantity: number; selectedVariant?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await usersAPI.addToCart(productId, quantity, selectedVariant);
      return response.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (
    { productId, selectedVariant }: 
    { productId: string; selectedVariant?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await usersAPI.removeFromCart(productId, selectedVariant);
      return response.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async (
    { productId, quantity, selectedVariant }: 
    { productId: string; quantity: number; selectedVariant?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      if (quantity <= 0) {
        return dispatch(removeFromCart({ productId, selectedVariant }));
      }
      
      // Remove existing item and add with new quantity
      await usersAPI.removeFromCart(productId, selectedVariant);
      const response = await usersAPI.addToCart(productId, quantity, selectedVariant);
      return response.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await usersAPI.clearCart();
      return [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

export const syncCartWithServer = createAsyncThunk(
  'cart/syncWithServer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getProfile();
      return response.cart?.items || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Local cart operations (for offline support)
    addItemLocally: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => 
          item.productId === action.payload.productId && 
          item.selectedVariant === action.payload.selectedVariant
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
    },

    removeItemLocally: (state, action: PayloadAction<{ productId: string; selectedVariant?: string }>) => {
      state.items = state.items.filter(
        item => 
          !(item.productId === action.payload.productId && 
            item.selectedVariant === action.payload.selectedVariant)
      );

      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
    },

    updateQuantityLocally: (
      state, 
      action: PayloadAction<{ productId: string; quantity: number; selectedVariant?: string }>
    ) => {
      const item = state.items.find(
        item => 
          item.productId === action.payload.productId && 
          item.selectedVariant === action.payload.selectedVariant
      );

      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            i => !(i.productId === action.payload.productId && 
                   i.selectedVariant === action.payload.selectedVariant)
          );
        } else {
          item.quantity = action.payload.quantity;
        }

        const totals = calculateTotals(state.items);
        state.total = totals.total;
        state.itemCount = totals.itemCount;
      }
    },

    clearCartLocally: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.items) {
          state.items = action.payload.items;
          const totals = calculateTotals(state.items);
          state.total = totals.total;
          state.itemCount = totals.itemCount;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.items) {
          state.items = action.payload.items;
          const totals = calculateTotals(state.items);
          state.total = totals.total;
          state.itemCount = totals.itemCount;
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.items) {
          state.items = action.payload.items;
          const totals = calculateTotals(state.items);
          state.total = totals.total;
          state.itemCount = totals.itemCount;
        }
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sync with server
      .addCase(syncCartWithServer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        const totals = calculateTotals(state.items);
        state.total = totals.total;
        state.itemCount = totals.itemCount;
      })
      .addCase(syncCartWithServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addItemLocally,
  removeItemLocally,
  updateQuantityLocally,
  clearCartLocally,
  setCartItems,
  toggleCart,
  openCart,
  closeCart,
  clearError,
} = cartSlice.actions;

export default cartSlice.reducer;
