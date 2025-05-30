import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchOrderById, cancelOrder } from '../store/slices/ordersSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  CreditCard,
  Phone,

} from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { currentOrder, isLoadingCurrent } = useSelector((state: RootState) => state.orders);
  const { hapticFeedback, showMainButton, hideMainButton } = useTelegramWebApp();

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentOrder && currentOrder.status === 'pending') {
      showMainButton('Cancel Order', handleCancelOrder);
    } else {
      hideMainButton();
    }

    return () => hideMainButton();
  }, [currentOrder]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-500" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-5 h-5 text-telegram-blue" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-telegram-blue" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-5 h-5 text-error-500" />;
      default:
        return <Clock className="w-5 h-5 text-telegram-text-secondary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'confirmed':
      case 'processing':
        return 'text-telegram-blue bg-blue-50 border-blue-200';
      case 'shipped':
        return 'text-telegram-blue bg-blue-50 border-blue-200';
      case 'delivered':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'cancelled':
      case 'refunded':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-telegram-text-secondary bg-gray-50 border-gray-200';
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;

    hapticFeedback.impact('medium');

    try {
      await dispatch(cancelOrder({
        orderId: currentOrder._id,
        reason: 'Cancelled by customer'
      })).unwrap();

      hapticFeedback.notification('success');
      toast.success('Order cancelled successfully');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to cancel order');
    }
  };

  const handleTrackOrder = () => {
    if (currentOrder?.trackingNumber) {
      hapticFeedback.impact('light');
      // Open tracking URL or show tracking info
      toast(`Tracking: ${currentOrder.trackingNumber}`);
    }
  };

  const handleContactSupport = () => {
    hapticFeedback.impact('light');
    // Open support chat or contact info
    toast('Contact support: @mezohit_support');
  };

  if (isLoadingCurrent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-4">Order not found</h2>
        <button onClick={() => navigate('/orders')} className="btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pb-20">
      {/* Order Header */}
      <div className="bg-white border-b border-telegram-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-telegram-text">
              Order #{currentOrder.orderNumber}
            </h1>
            <p className="text-sm text-telegram-text-secondary">
              Placed on {formatDate(currentOrder.createdAt)}
            </p>
          </div>
          <div className={`inline-flex items-center px-3 py-2 rounded-full border ${getStatusColor(currentOrder.status)}`}>
            {getStatusIcon(currentOrder.status)}
            <span className="ml-2 font-medium capitalize">{currentOrder.status}</span>
          </div>
        </div>

        <div className="text-2xl font-bold text-telegram-text">
          {formatPrice(currentOrder.total, currentOrder.currency)}
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white border-b border-telegram-border p-4">
        <h2 className="font-semibold text-telegram-text mb-4">Order Status</h2>
        <div className="space-y-3">
          {currentOrder.statusHistory.map((status, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                index === 0 ? 'bg-telegram-blue' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{status.status}</span>
                  <span className="text-sm text-telegram-text-secondary">
                    {formatDate(status.timestamp)}
                  </span>
                </div>
                {status.note && (
                  <p className="text-sm text-telegram-text-secondary">{status.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Information */}
      {currentOrder.trackingNumber && (
        <div className="bg-white border-b border-telegram-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-telegram-text">Tracking Information</h3>
              <p className="text-sm text-telegram-text-secondary">
                {currentOrder.shippingCarrier}: {currentOrder.trackingNumber}
              </p>
            </div>
            <button
              onClick={handleTrackOrder}
              className="btn-outline btn-sm"
            >
              Track Package
            </button>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white border-b border-telegram-border p-4">
        <h2 className="font-semibold text-telegram-text mb-4">
          Items ({currentOrder.items.length})
        </h2>
        <div className="space-y-4">
          {currentOrder.items.map((item, index) => (
            <div key={index} className="flex space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-telegram-text mb-1">{item.name}</h3>
                {item.selectedVariant && (
                  <p className="text-sm text-telegram-text-secondary mb-1">
                    Variant: {item.selectedVariant}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-telegram-text-secondary">
                    Qty: {item.quantity}
                  </span>
                  <span className="font-medium text-telegram-text">
                    {formatPrice(item.price * item.quantity, currentOrder.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white border-b border-telegram-border p-4">
        <h2 className="font-semibold text-telegram-text mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-telegram-text-secondary">Subtotal</span>
            <span className="text-telegram-text">
              {formatPrice(currentOrder.subtotal, currentOrder.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-telegram-text-secondary">Shipping</span>
            <span className="text-telegram-text">
              {formatPrice(currentOrder.shippingCost, currentOrder.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-telegram-text-secondary">Tax</span>
            <span className="text-telegram-text">
              {formatPrice(currentOrder.taxAmount, currentOrder.currency)}
            </span>
          </div>
          {currentOrder.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-telegram-text-secondary">Discount</span>
              <span className="text-success-600">
                -{formatPrice(currentOrder.discountAmount, currentOrder.currency)}
              </span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span className="text-telegram-text">Total</span>
            <span className="text-telegram-text">
              {formatPrice(currentOrder.total, currentOrder.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white border-b border-telegram-border p-4">
        <div className="flex items-center mb-3">
          <MapPin className="w-5 h-5 text-telegram-blue mr-2" />
          <h2 className="font-semibold text-telegram-text">Shipping Address</h2>
        </div>
        <div className="text-telegram-text">
          <p className="font-medium">
            {currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}
          </p>
          <p>{currentOrder.shippingAddress.address1}</p>
          {currentOrder.shippingAddress.address2 && (
            <p>{currentOrder.shippingAddress.address2}</p>
          )}
          <p>
            {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.postalCode}
          </p>
          <p>{currentOrder.shippingAddress.country}</p>
          <div className="flex items-center mt-2">
            <Phone className="w-4 h-4 mr-2" />
            <span>{currentOrder.shippingAddress.phone}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white border-b border-telegram-border p-4">
        <div className="flex items-center mb-3">
          <CreditCard className="w-5 h-5 text-telegram-blue mr-2" />
          <h2 className="font-semibold text-telegram-text">Payment Information</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-telegram-text-secondary">Payment Method</span>
            <span className="text-telegram-text capitalize">
              {currentOrder.paymentMethod || 'Telegram Payments'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-telegram-text-secondary">Payment Status</span>
            <span className={`font-medium capitalize ${
              currentOrder.paymentStatus === 'paid'
                ? 'text-success-600'
                : currentOrder.paymentStatus === 'failed'
                ? 'text-error-600'
                : 'text-warning-600'
            }`}>
              {currentOrder.paymentStatus}
            </span>
          </div>
          {currentOrder.paymentId && (
            <div className="flex justify-between">
              <span className="text-telegram-text-secondary">Payment ID</span>
              <span className="text-telegram-text font-mono text-sm">
                {currentOrder.paymentId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order Notes */}
      {currentOrder.notes && (
        <div className="bg-white border-b border-telegram-border p-4">
          <h2 className="font-semibold text-telegram-text mb-3">Order Notes</h2>
          <p className="text-telegram-text-secondary">{currentOrder.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        {currentOrder.status === 'pending' && (
          <button
            onClick={handleCancelOrder}
            className="w-full btn-outline text-error-500 border-error-500 hover:bg-error-50"
          >
            Cancel Order
          </button>
        )}

        <button
          onClick={handleContactSupport}
          className="w-full btn-secondary"
        >
          Contact Support
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="w-full btn-primary"
        >
          Back to Orders
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;
