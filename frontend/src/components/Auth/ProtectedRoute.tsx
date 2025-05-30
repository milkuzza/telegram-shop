import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { authenticateWithTelegram } from '../../store/slices/authSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import LoadingScreen from '../UI/LoadingScreen';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { webApp, isReady } = useSelector((state: RootState) => state.telegram);
  const { isWebAppAvailable } = useTelegramWebApp();

  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoading) {
      // Try to authenticate with Telegram data
      if (webApp?.initData) {
        dispatch(authenticateWithTelegram(webApp.initData));
      } else {
        // No Telegram data available, show toast and redirect
        if (isWebAppAvailable) {
          // In Telegram WebApp, just redirect silently
          navigate('/');
        } else {
          // In browser, show toast notification
          toast.error('Please open this app through Telegram to access this feature.');
          setTimeout(() => navigate('/'), 2000);
        }
      }
    }
  }, [isReady, isAuthenticated, isLoading, webApp, dispatch, navigate, isWebAppAvailable]);

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-telegram-text mb-4">
            Authentication Required
          </h2>
          <p className="text-telegram-text-secondary mb-6">
            Please open this app through Telegram to access this feature.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
