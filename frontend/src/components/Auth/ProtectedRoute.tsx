import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { authenticateWithTelegram } from '../../store/slices/authSlice';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import LoadingScreen from '../UI/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { webApp, isReady } = useSelector((state: RootState) => state.telegram);
  
  const { showAlert } = useTelegramWebApp();

  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoading) {
      // Try to authenticate with Telegram data
      if (webApp?.initData) {
        dispatch(authenticateWithTelegram(webApp.initData));
      } else {
        // No Telegram data available, redirect to home
        showAlert('Please open this app through Telegram to access this feature.', () => {
          navigate('/');
        });
      }
    }
  }, [isReady, isAuthenticated, isLoading, webApp, dispatch, navigate, showAlert]);

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
