import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchProducts, setFilters } from '../store/slices/productsSlice';
import { fetchCategoryBySlug } from '../store/slices/categoriesSlice';
import ProductsPage from './ProductsPage';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentCategory, isLoadingCurrent } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    if (slug) {
      dispatch(fetchCategoryBySlug(slug));
    }
  }, [slug, dispatch]);

  useEffect(() => {
    if (currentCategory) {
      // Set category filter for products
      dispatch(setFilters({
        category: currentCategory._id,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }));
    }
  }, [currentCategory, dispatch]);

  if (isLoadingCurrent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-4">Category not found</h2>
      </div>
    );
  }

  // Use ProductsPage component with category context
  return <ProductsPage />;
};

export default CategoryPage;
