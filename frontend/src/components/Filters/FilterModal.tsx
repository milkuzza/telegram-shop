import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setFilterOpen } from '../../store/slices/uiSlice';
import ProductFilters from '../Products/ProductFilters';

const FilterModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isFilterOpen } = useSelector((state: RootState) => state.ui);
  const { filters } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);

  const handleClose = () => {
    dispatch(setFilterOpen(false));
  };

  const handleFiltersChange = (newFilters: any) => {
    // This would typically dispatch an action to update filters
    // For now, we'll just close the modal
    dispatch(setFilterOpen(false));
  };

  if (!isFilterOpen) return null;

  return (
    <ProductFilters
      filters={filters}
      categories={categories}
      onFiltersChange={handleFiltersChange}
      onClose={handleClose}
    />
  );
};

export default FilterModal;
