import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchProductById, fetchRelatedProducts, addProductReview } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { Star, Heart, Share2, Plus, Minus } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ReviewForm from '../components/Products/ReviewForm';
import toast from 'react-hot-toast';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { currentProduct, relatedProducts, isLoadingCurrent } = useSelector(
    (state: RootState) => state.products
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback, showMainButton, hideMainButton } = useTelegramWebApp();

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchRelatedProducts({ productId: id }));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentProduct) {
      showMainButton('Add to Cart', handleAddToCart);
    }
    return () => hideMainButton();
  }, [currentProduct, quantity, selectedVariant, showMainButton, hideMainButton]);

  const handleAddToCart = async () => {
    if (!currentProduct) return;

    hapticFeedback.impact('medium');

    try {
      await dispatch(addToCart({
        productId: currentProduct._id,
        quantity,
        selectedVariant: selectedVariant || undefined,
      })).unwrap();

      hapticFeedback.notification('success');
      toast.success('Added to cart!');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to add to cart');
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(quantity + delta, currentProduct?.stock || 1));
    setQuantity(newQuantity);
    hapticFeedback.impact('light');
  };

  const handleVariantChange = (variant: string) => {
    setSelectedVariant(variant);
    hapticFeedback.impact('light');
  };

  const handleShare = () => {
    hapticFeedback.impact('light');
    if (navigator.share && currentProduct) {
      navigator.share({
        title: currentProduct.name,
        text: currentProduct.shortDescription || currentProduct.description,
        url: window.location.href,
      });
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!currentProduct) return;

    try {
      await dispatch(addProductReview({
        productId: currentProduct._id,
        rating,
        comment,
      })).unwrap();

      setShowReviewForm(false);
      hapticFeedback.notification('success');
      toast.success('Review added successfully!');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to add review');
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  if (isLoadingCurrent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Browse Products
        </button>
      </div>
    );
  }

  const images = currentProduct.images.length > 0 ? currentProduct.images : ['/placeholder-product.png'];

  return (
    <div className="min-h-screen bg-primary pb-20">
      {/* Product Images */}
      <div className="relative">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          onSlideChange={(swiper: any) => setActiveImageIndex(swiper.activeIndex)}
          className="aspect-square"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <img
                src={image}
                alt={`${currentProduct.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={handleShare}
            className="p-2 bg-white rounded-full shadow-lg"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white rounded-full shadow-lg">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Discount badge */}
        {currentProduct.discountPercentage > 0 && (
          <div className="absolute top-4 left-4 bg-error-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            -{currentProduct.discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-telegram-text mb-2">
            {currentProduct.name}
          </h1>

          <div className="flex items-center mb-3">
            <div className="flex items-center mr-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(currentProduct.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-telegram-text-secondary">
                {currentProduct.rating.toFixed(1)} ({currentProduct.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl font-bold text-telegram-text">
              {formatPrice(currentProduct.price, currentProduct.currency)}
            </span>
            {currentProduct.comparePrice && currentProduct.comparePrice > currentProduct.price && (
              <span className="text-lg text-telegram-text-secondary line-through">
                {formatPrice(currentProduct.comparePrice, currentProduct.currency)}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className="mb-4">
            {currentProduct.stock > 0 ? (
              <span className="text-success-600 text-sm font-medium">
                ✓ In Stock ({currentProduct.stock} available)
              </span>
            ) : (
              <span className="text-error-500 text-sm font-medium">
                ✗ Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Variants */}
        {currentProduct.variants && Object.keys(currentProduct.variants).length > 0 && (
          <div className="mb-6">
            {Object.entries(currentProduct.variants).map(([key, variant]) => (
              <div key={key} className="mb-4">
                <h3 className="font-medium mb-2">{variant.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleVariantChange(option.value)}
                      className={`px-3 py-2 border rounded-lg text-sm ${
                        selectedVariant === option.value
                          ? 'border-telegram-blue bg-telegram-blue text-white'
                          : 'border-telegram-border text-telegram-text'
                      }`}
                    >
                      {option.value}
                      {option.price && ` (+${formatPrice(option.price, currentProduct.currency)})`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity selector */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Quantity</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="p-2 border border-telegram-border rounded-lg disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium w-12 text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= currentProduct.stock}
              className="p-2 border border-telegram-border rounded-lg disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-telegram-text-secondary leading-relaxed">
            {currentProduct.description}
          </p>
        </div>

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Reviews ({currentProduct.reviewCount})</h3>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-telegram-blue text-sm font-medium"
              >
                Write Review
              </button>
            )}
          </div>

          {currentProduct.reviews.length > 0 ? (
            <div className="space-y-4">
              {currentProduct.reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="border-b border-telegram-border pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-telegram-text-secondary">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-telegram-text">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-telegram-text-secondary text-sm">No reviews yet</p>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 className="font-medium mb-4">Related Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} viewMode="grid" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          onSubmit={handleReviewSubmit}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
