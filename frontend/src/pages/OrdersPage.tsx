import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { orders, isLoading, pagination } = useSelector((state: RootState) => state.orders);
  const { hapticFeedback } = useTelegramWebApp();

  useEffect(() => {
    dispatch(fetchOrders({ page: 1, limit: 20 }));
  }, [dispatch]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4 text-telegram-blue" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-telegram-blue" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4 text-error-500" />;
      default:
        return <Clock className="w-4 h-4 text-telegram-text-secondary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-warning-600 bg-warning-50';
      case 'confirmed':
      case 'processing':
        return 'text-telegram-blue bg-blue-50';
      case 'shipped':
        return 'text-telegram-blue bg-blue-50';
      case 'delivered':
        return 'text-success-600 bg-success-50';
      case 'cancelled':
      case 'refunded':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-telegram-text-secondary bg-gray-50';
    }
  };

  const handleOrderClick = (orderId: string) => {
    hapticFeedback.impact('light');
    navigate(`/orders/${orderId}`);
  };

  const handleContinueShopping = () => {
    hapticFeedback.impact('light');
    navigate('/products');
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-telegram-text-secondary" />
          </div>
          <h2 className="text-2xl font-semibold text-telegram-text mb-4">
            No orders yet
          </h2>
          <p className="text-telegram-text-secondary mb-8">
            You haven't placed any orders yet. Start shopping to see your orders here.
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
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="bg-white border-b border-telegram-border p-4">
        <h1 className="text-xl font-semibold text-telegram-text">
          My Orders ({pagination.total})
        </h1>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            onClick={() => handleOrderClick(order._id)}
            className="bg-white rounded-lg border border-telegram-border p-4 cursor-pointer hover:shadow-card transition-shadow"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-telegram-text">
                  Order #{order.orderNumber}
                </h3>
                <p className="text-sm text-telegram-text-secondary">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-telegram-text">
                  {formatPrice(order.total, order.currency)}
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-telegram-text truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-telegram-text-secondary">
                      Qty: {item.quantity} × {formatPrice(item.price, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
              
              {order.items.length > 2 && (
                <p className="text-xs text-telegram-text-secondary">
                  +{order.items.length - 2} more items
                </p>
              )}
            </div>

            {/* Order Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-telegram-border">
              <div className="text-sm text-telegram-text-secondary">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
              
              <div className="flex items-center space-x-2">
                {order.trackingNumber && (
                  <span className="text-xs bg-telegram-blue text-white px-2 py-1 rounded">
                    Tracking: {order.trackingNumber}
                  </span>
                )}
                
                {order.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle cancel order
                    }}
                    className="text-xs text-error-500 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {pagination.page < pagination.totalPages && (
        <div className="p-4">
          <button
            onClick={() => dispatch(fetchOrders({ 
              page: pagination.page + 1, 
              limit: pagination.limit 
            }))}
            disabled={isLoading}
            className="w-full btn-secondary"
          >
            {isLoading ? 'Loading...' : 'Load More Orders'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
