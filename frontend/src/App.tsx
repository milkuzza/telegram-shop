import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store/store';
import { initializeTelegramWebApp } from './store/slices/telegramSlice';
import { loadUser } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingScreen from './components/UI/LoadingScreen';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import ProductForm from './pages/admin/ProductForm';
import Analytics from './pages/admin/Analytics';
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';

// Hooks
import { useTelegramWebApp } from './hooks/useTelegramWebApp';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading: telegramLoading, isReady } = useTelegramWebApp();

  useEffect(() => {
    // Initialize Telegram Web App
    dispatch(initializeTelegramWebApp());
  }, [dispatch]);

  useEffect(() => {
    // Load user data when Telegram is ready
    if (isReady) {
      dispatch(loadUser());
    }
  }, [dispatch, isReady]);

  if (telegramLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App min-h-screen bg-primary">
      <Routes>
        {/* Admin routes (without Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <AdminProtectedRoute>
            <ProductsManagement />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/products/new" element={
          <AdminProtectedRoute>
            <ProductForm />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/products/:id/edit" element={
          <AdminProtectedRoute>
            <ProductForm />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminProtectedRoute>
            <Analytics />
          </AdminProtectedRoute>
        } />

        {/* Main app routes (with Layout) */}
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />

          {/* Protected routes */}
          <Route path="cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="orders/:id" element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="favorites" element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          } />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
