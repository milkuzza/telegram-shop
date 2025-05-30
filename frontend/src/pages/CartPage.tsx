import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  syncCartWithServer
} from '../store/slices/cartSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, total, itemCount, isLoading } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback, showMainButton, hideMainButton } = useTelegramWebApp();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(syncCartWithServer());
    }
  }, [dispatch, isAuthenticated]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const handleCheckout = () => {
    hapticFeedback.impact('medium');

    if (!isAuthenticated) {
      toast.error('Please login to continue');
      return;
    }

    navigate('/checkout');
  };

  useEffect(() => {
    if (items.length > 0) {
      showMainButton(`Checkout (${formatPrice(total)})`, handleCheckout);
    } else {
      hideMainButton();
    }

    return () => hideMainButton();
  }, [items.length, total, showMainButton, hideMainButton, handleCheckout]);

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

  const handleContinueShopping = () => {
    hapticFeedback.impact('light');
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-telegram-text-secondary" />
          </div>
          <h2 className="text-2xl font-semibold text-telegram-text mb-4">
            Your cart is empty
          </h2>
          <p className="text-telegram-text-secondary mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <button
            onClick={handleContinueShopping}
            className="btn-primary"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pb-20">
      {/* Header */}
      <div className="bg-white border-b border-telegram-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-telegram-text">
            Shopping Cart ({itemCount} items)
          </h1>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-error-500 text-sm font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedVariant || 'default'}`}
               className="bg-white rounded-lg border border-telegram-border p-4">
            <div className="flex space-x-4">
              {/* Product Image */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-telegram-text mb-1 line-clamp-2">
                  {item.name}
                </h3>

                {item.selectedVariant && (
                  <p className="text-sm text-telegram-text-secondary mb-2">
                    Variant: {item.selectedVariant}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                  <div className="text-right">
                    <div className="font-semibold text-telegram-text">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-xs text-telegram-text-secondary">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="p-4">
        <div className="bg-white rounded-lg border border-telegram-border p-4">
          <h3 className="font-semibold text-telegram-text mb-4">Order Summary</h3>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-telegram-text-secondary">Subtotal ({itemCount} items)</span>
              <span className="text-telegram-text">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-telegram-text-secondary">Shipping</span>
              <span className="text-telegram-text">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-telegram-text-secondary">Tax</span>
              <span className="text-telegram-text">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-telegram-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-telegram-text">Total</span>
              <span className="text-xl font-bold text-telegram-text">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Checkout Button (Desktop) */}
          <button
            onClick={handleCheckout}
            disabled={!isAuthenticated}
            className="w-full mt-4 btn-primary disabled:opacity-50"
          >
            {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>

          {/* Continue Shopping */}
          <button
            onClick={handleContinueShopping}
            className="w-full mt-2 btn-secondary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
