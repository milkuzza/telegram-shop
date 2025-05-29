import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  onClose: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onClose }) => {
  const { hapticFeedback } = useTelegramWebApp();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = (value: number) => {
    hapticFeedback.impact('light');
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      hapticFeedback.notification('error');
      return;
    }

    setIsSubmitting(true);
    hapticFeedback.impact('medium');
    
    try {
      await onSubmit(rating, comment.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    hapticFeedback.impact('light');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Review Form */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-telegram-border">
            <h2 className="text-lg font-semibold text-telegram-text">
              Write a Review
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 p-4 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  How would you rate this product?
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRatingClick(value)}
                      onMouseEnter={() => handleRatingHover(value)}
                      onMouseLeave={handleRatingLeave}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          value <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-telegram-text-secondary mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tell us about your experience (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                  className="w-full px-3 py-2 border border-telegram-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-telegram-text-secondary">
                    {comment.length}/500 characters
                  </span>
                </div>
              </div>

              {/* Review Guidelines */}
              <div className="bg-telegram-bg-secondary rounded-lg p-3">
                <h4 className="text-sm font-medium text-telegram-text mb-2">
                  Review Guidelines
                </h4>
                <ul className="text-xs text-telegram-text-secondary space-y-1">
                  <li>• Be honest and helpful to other customers</li>
                  <li>• Focus on the product's features and quality</li>
                  <li>• Avoid personal information or inappropriate content</li>
                  <li>• Reviews are public and cannot be edited after submission</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-telegram-border p-4 space-y-3">
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
