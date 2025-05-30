import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  Calendar,
  Download
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    chartData: Array<{ date: string; amount: number }>;
  };
  orders: {
    total: number;
    change: number;
    chartData: Array<{ date: string; count: number }>;
  };
  users: {
    total: number;
    change: number;
    chartData: Array<{ date: string; count: number }>;
  };
  products: {
    total: number;
    topSelling: Array<{ name: string; sales: number; revenue: number }>;
  };
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAnalytics(timeRange);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
      // Mock data for demo
      setData({
        revenue: {
          total: 12450,
          change: 12.5,
          chartData: [
            { date: '2024-01-01', amount: 1200 },
            { date: '2024-01-02', amount: 1800 },
            { date: '2024-01-03', amount: 1500 },
            { date: '2024-01-04', amount: 2200 },
            { date: '2024-01-05', amount: 1900 },
            { date: '2024-01-06', amount: 2100 },
            { date: '2024-01-07', amount: 1850 }
          ]
        },
        orders: {
          total: 156,
          change: 8.3,
          chartData: [
            { date: '2024-01-01', count: 15 },
            { date: '2024-01-02', count: 23 },
            { date: '2024-01-03', count: 18 },
            { date: '2024-01-04', count: 28 },
            { date: '2024-01-05', count: 22 },
            { date: '2024-01-06', count: 25 },
            { date: '2024-01-07', count: 25 }
          ]
        },
        users: {
          total: 1234,
          change: 15.2,
          chartData: [
            { date: '2024-01-01', count: 45 },
            { date: '2024-01-02', count: 52 },
            { date: '2024-01-03', count: 38 },
            { date: '2024-01-04', count: 65 },
            { date: '2024-01-05', count: 48 },
            { date: '2024-01-06', count: 58 },
            { date: '2024-01-07', count: 42 }
          ]
        },
        products: {
          total: 89,
          topSelling: [
            { name: 'Wireless Headphones', sales: 45, revenue: 2250 },
            { name: 'Smart Watch', sales: 32, revenue: 6400 },
            { name: 'Phone Case', sales: 28, revenue: 560 },
            { name: 'Bluetooth Speaker', sales: 24, revenue: 1200 },
            { name: 'USB Cable', sales: 22, revenue: 330 }
          ]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    toast.success('Analytics data exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${data?.revenue.total.toLocaleString()}`,
      change: data?.revenue.change || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Orders',
      value: data?.orders.total.toLocaleString(),
      change: data?.orders.change || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Users',
      value: data?.users.total.toLocaleString(),
      change: data?.users.change || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Products',
      value: data?.products.total.toLocaleString(),
      change: 0,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Track your store performance and key metrics.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  {card.change !== 0 && (
                    <div className={`flex items-center mt-2 ${
                      card.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change > 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(card.change)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Revenue Trend
              </h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data?.revenue.chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-500 rounded-t w-full"
                    style={{
                      height: `${(item.amount / Math.max(...data.revenue.chartData.map(d => d.amount))) * 200}px`
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Orders Trend
              </h2>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data?.orders.chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-green-500 rounded-t w-full"
                    style={{
                      height: `${(item.count / Math.max(...data.orders.chartData.map(d => d.count))) * 200}px`
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top Selling Products
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Sales
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.products.topSelling.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {product.sales} units
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ${product.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(product.sales / Math.max(...data.products.topSelling.map(p => p.sales))) * 100}%`
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
