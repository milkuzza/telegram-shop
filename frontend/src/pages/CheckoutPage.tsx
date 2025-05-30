import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { createOrder } from '../store/slices/ordersSlice';
import { clearCart } from '../store/slices/cartSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useForm } from 'react-hook-form';
import { MapPin, CreditCard, Truck } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  notes?: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, total } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isCreating } = useSelector((state: RootState) => state.orders);

  const [paymentMethod, setPaymentMethod] = useState('telegram');
  const [shippingMethod, setShippingMethod] = useState('standard');

  const { hapticFeedback, showMainButton, hideMainButton, webApp } = useTelegramWebApp();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutForm>();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill form with user data
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName || '');
      if (user.shippingAddress) {
        setValue('address1', user.shippingAddress.address);
        setValue('city', user.shippingAddress.city);
        setValue('postalCode', user.shippingAddress.postalCode);
        setValue('country', user.shippingAddress.country);
        setValue('phone', user.shippingAddress.phone);
      }
    }
  }, [user, items.length, navigate, setValue]);

  useEffect(() => {
    showMainButton(`Pay ${formatPrice(calculateTotal())}`, handlePlaceOrder);
    return () => hideMainButton();
  }, [total, shippingMethod]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const getShippingCost = () => {
    switch (shippingMethod) {
      case 'express': return 15.99;
      case 'overnight': return 29.99;
      default: return 5.99;
    }
  };

  const getTaxAmount = () => {
    return total * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return total + getShippingCost() + getTaxAmount();
  };

  const onSubmit = async (data: CheckoutForm) => {
    await handlePlaceOrder(data);
  };

  const handlePlaceOrder = async (formData?: CheckoutForm) => {
    hapticFeedback.impact('medium');

    if (!formData) {
      // Trigger form submission
      handleSubmit(onSubmit)();
      return;
    }

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant,
          thumbnail: item.thumbnail,
        })),
        subtotal: total,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        total: calculateTotal(),
        currency: 'USD',
        paymentMethod,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        },
        notes: formData.notes,
      };

      if (paymentMethod === 'telegram' && webApp) {
        // Use Telegram Payments
        // const invoice = {
        //   title: 'Mezohit Store Order',
        //   description: `Order with ${items.length} items`,
        //   payload: JSON.stringify({ orderData }),
        //   provider_token: process.env.REACT_APP_TELEGRAM_PAYMENT_PROVIDER_TOKEN,
        //   currency: 'USD',
        //   prices: [
        //     { label: 'Subtotal', amount: Math.round(total * 100) },
        //     { label: 'Shipping', amount: Math.round(getShippingCost() * 100) },
        //     { label: 'Tax', amount: Math.round(getTaxAmount() * 100) },
        //   ],
        // };

        // Telegram Payments not available in development
        // webApp.openInvoice(invoice, (status: string) => {
        //   if (status === 'paid') {
        //     handlePaymentSuccess(orderData);
        //   } else {
        //     hapticFeedback.notification('error');
        //     toast.error('Payment cancelled');
        //   }
        // });

        // For development, directly process the order
        await handlePaymentSuccess(orderData);
      } else {
        // Direct order creation (for other payment methods)
        await handlePaymentSuccess(orderData);
      }
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to place order');
    }
  };

  const handlePaymentSuccess = async (orderData: any) => {
    try {
      const order = await dispatch(createOrder(orderData)).unwrap();
      await dispatch(clearCart());

      hapticFeedback.notification('success');
      toast.success('Order placed successfully!');

      navigate(`/orders/${order.id || order._id}`);
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to create order');
    }
  };

  if (items.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-primary pb-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white border-b border-telegram-border p-4">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={`${item.productId}-${item.selectedVariant}`}
                   className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border-b border-telegram-border p-4">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-telegram-blue mr-2" />
            <h2 className="text-lg font-semibold">Shipping Address</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="input"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-error-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="input"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-error-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              {...register('phone', { required: 'Phone is required' })}
              className="input"
              placeholder="+1234567890"
              type="tel"
            />
            {errors.phone && (
              <p className="text-error-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              {...register('address1', { required: 'Address is required' })}
              className="input"
              placeholder="123 Main Street"
            />
            {errors.address1 && (
              <p className="text-error-500 text-xs mt-1">{errors.address1.message}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
            <input
              {...register('address2')}
              className="input"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                {...register('city', { required: 'City is required' })}
                className="input"
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-error-500 text-xs mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                {...register('postalCode', { required: 'Postal code is required' })}
                className="input"
                placeholder="10001"
              />
              {errors.postalCode && (
                <p className="text-error-500 text-xs mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              {...register('country', { required: 'Country is required' })}
              className="input"
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="RU">Russia</option>
            </select>
            {errors.country && (
              <p className="text-error-500 text-xs mt-1">{errors.country.message}</p>
            )}
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white border-b border-telegram-border p-4">
          <div className="flex items-center mb-4">
            <Truck className="w-5 h-5 text-telegram-blue mr-2" />
            <h2 className="text-lg font-semibold">Shipping Method</h2>
          </div>

          <div className="space-y-3">
            {[
              { id: 'standard', name: 'Standard Shipping', time: '5-7 business days', price: 5.99 },
              { id: 'express', name: 'Express Shipping', time: '2-3 business days', price: 15.99 },
              { id: 'overnight', name: 'Overnight Shipping', time: '1 business day', price: 29.99 },
            ].map((method) => (
              <label key={method.id} className="flex items-center p-3 border border-telegram-border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="shipping"
                  value={method.id}
                  checked={shippingMethod === method.id}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-telegram-text-secondary">{method.time}</div>
                </div>
                <div className="font-medium">{formatPrice(method.price)}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white border-b border-telegram-border p-4">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-telegram-blue mr-2" />
            <h2 className="text-lg font-semibold">Payment Method</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center p-3 border border-telegram-border rounded-lg cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="telegram"
                checked={paymentMethod === 'telegram'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Telegram Payments</div>
                <div className="text-sm text-telegram-text-secondary">Pay securely through Telegram</div>
              </div>
            </label>
          </div>
        </div>

        {/* Order Notes */}
        <div className="bg-white border-b border-telegram-border p-4">
          <h2 className="text-lg font-semibold mb-4">Order Notes (Optional)</h2>
          <textarea
            {...register('notes')}
            className="input"
            rows={3}
            placeholder="Special instructions for your order..."
          />
        </div>

        {/* Total */}
        <div className="bg-white p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(getShippingCost())}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatPrice(getTaxAmount())}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>
          </div>

          {/* Place Order Button (Desktop) */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full mt-4 btn-primary disabled:opacity-50"
          >
            {isCreating ? 'Processing...' : `Place Order ${formatPrice(calculateTotal())}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
