import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  closeCart
} from '../../store/slices/cartSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, total, itemCount, isLoading, isOpen } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback } = useTelegramWebApp();

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const handleClose = () => {
    hapticFeedback.impact('light');
    dispatch(closeCart());
  };

  const handleQuantityChange = async (productId: string, newQuantity: number, selectedVariant?: string) => {
    hapticFeedback.impact('light');

    try {
      await dispatch(updateCartItemQuantity({
        productId,
        quantity: newQuantity,
        selectedVariant,
      })).unwrap();
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId: string, selectedVariant?: string) => {
    hapticFeedback.impact('medium');

    try {
      await dispatch(removeFromCart({ productId, selectedVariant })).unwrap();
      hapticFeedback.notification('success');
      toast.success('Item removed from cart');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    hapticFeedback.impact('heavy');

    try {
      await dispatch(clearCart()).unwrap();
      hapticFeedback.notification('success');
      toast.success('Cart cleared');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    hapticFeedback.impact('medium');

    if (!isAuthenticated) {
      toast.error('Please login to continue');
      return;
    }

    dispatch(closeCart());
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    hapticFeedback.impact('light');
    dispatch(closeCart());
    navigate('/products');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-telegram-border">
            <h2 className="text-lg font-semibold text-telegram-text">
              Shopping Cart ({itemCount})
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="w-16 h-16 bg-telegram-bg-secondary rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-telegram-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-telegram-text mb-2">
                  Your cart is empty
                </h3>
                <p className="text-telegram-text-secondary text-center mb-6">
                  Add some products to get started
                </p>
                <button
                  onClick={handleContinueShopping}
                  className="btn-primary"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Clear Cart Button */}
                {items.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleClearCart}
                      className="text-error-500 text-sm font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* Cart Items */}
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedVariant || 'default'}`}
                       className="border border-telegram-border rounded-lg p-3">
                    <div className="flex space-x-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-telegram-text text-sm mb-1 line-clamp-2">
                          {item.name}
                        </h3>

                        {item.selectedVariant && (
                          <p className="text-xs text-telegram-text-secondary mb-2">
                            {item.selectedVariant}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(
                                item.productId,
                                item.quantity - 1,
                                item.selectedVariant
                              )}
                              disabled={item.quantity <= 1}
                              className="p-1 border border-telegram-border rounded disabled:opacity-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => handleQuantityChange(
                                item.productId,
                                item.quantity + 1,
                                item.selectedVariant
                              )}
                              disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                              className="p-1 border border-telegram-border rounded disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.selectedVariant)}
                            className="p-1 text-error-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="mt-2 text-right">
                          <div className="font-semibold text-telegram-text text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-xs text-telegram-text-secondary">
                            {formatPrice(item.price)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-telegram-border p-4 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-telegram-text">Total</span>
                <span className="text-xl font-bold text-telegram-text">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={!isAuthenticated}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {isAuthenticated ? 'Checkout' : 'Login to Checkout'}
                </button>

                <button
                  onClick={handleContinueShopping}
                  className="w-full btn-secondary"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
