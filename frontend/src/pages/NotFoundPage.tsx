import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramWebApp();

  const handleGoHome = () => {
    hapticFeedback.impact('light');
    navigate('/');
  };

  const handleGoBack = () => {
    hapticFeedback.impact('light');
    navigate(-1);
  };

  const handleSearch = () => {
    hapticFeedback.impact('light');
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-telegram-blue opacity-20 mb-4">
            404
          </div>
          <div className="w-32 h-32 bg-telegram-bg-secondary rounded-full flex items-center justify-center mx-auto">
            <Search className="w-16 h-16 text-telegram-text-secondary" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-telegram-text mb-4">
          Page Not Found
        </h1>
        <p className="text-telegram-text-secondary mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full btn-primary"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          
          <button
            onClick={handleSearch}
            className="w-full btn-outline"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Products
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-telegram-border">
          <p className="text-sm text-telegram-text-secondary">
            Need help? Contact our support team at{' '}
            <a 
              href="https://t.me/mezohit_support" 
              className="text-telegram-blue hover:underline"
            >
              @mezohit_support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
