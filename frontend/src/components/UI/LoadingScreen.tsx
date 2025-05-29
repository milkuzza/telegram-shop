import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="w-8 h-8 text-telegram-blue animate-spin mx-auto" />
        </div>
        <p className="text-telegram-text-secondary text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
