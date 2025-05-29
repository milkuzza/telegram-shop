import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { updateUser, logout } from '../store/slices/authSlice';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings, 
  Heart, 
  Package, 
  CreditCard,
  Bell,
  Globe,
  LogOut,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { hapticFeedback } = useTelegramWebApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.shippingAddress?.address || '',
      city: user?.shippingAddress?.city || '',
      country: user?.shippingAddress?.country || '',
    },
  });

  const handleEditToggle = () => {
    hapticFeedback.impact('light');
    if (isEditing) {
      reset(); // Reset form to original values
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: ProfileForm) => {
    hapticFeedback.impact('medium');
    
    try {
      await dispatch(updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        shippingAddress: {
          address: data.address,
          city: data.city,
          country: data.country,
          phone: data.phone,
        },
      })).unwrap();
      
      setIsEditing(false);
      hapticFeedback.notification('success');
      toast.success('Profile updated successfully!');
    } catch (error) {
      hapticFeedback.notification('error');
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    hapticFeedback.impact('heavy');
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  const handleTabChange = (tab: string) => {
    hapticFeedback.impact('light');
    setActiveTab(tab);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please login to view profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-telegram-blue to-telegram-blue-dark text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-telegram-blue-light opacity-90">
              @{user.username || 'telegram_user'}
            </p>
            {user.isPremium && (
              <span className="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded-full mt-1">
                Premium
              </span>
            )}
          </div>
          <button
            onClick={handleEditToggle}
            className="p-2 bg-white bg-opacity-20 rounded-full"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-telegram-border">
        <div className="flex">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-telegram-blue text-telegram-blue'
                    : 'border-transparent text-telegram-text-secondary hover:text-telegram-text'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    disabled={!isEditing}
                    className="input disabled:bg-gray-50"
                  />
                  {errors.firstName && (
                    <p className="text-error-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    {...register('lastName')}
                    disabled={!isEditing}
                    className="input disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  disabled={!isEditing}
                  className="input disabled:bg-gray-50"
                  type="email"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-error-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  {...register('phone')}
                  disabled={!isEditing}
                  className="input disabled:bg-gray-50"
                  type="tel"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Shipping Address</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    {...register('address')}
                    disabled={!isEditing}
                    className="input disabled:bg-gray-50"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      {...register('city')}
                      disabled={!isEditing}
                      className="input disabled:bg-gray-50"
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <select
                      {...register('country')}
                      disabled={!isEditing}
                      className="input disabled:bg-gray-50"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="RU">Russia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 border border-telegram-border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-telegram-blue mr-3" />
                    <span>My Favorites</span>
                  </div>
                  <span className="text-telegram-text-secondary">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border border-telegram-border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-telegram-blue mr-3" />
                    <span>Order History</span>
                  </div>
                  <span className="text-telegram-text-secondary">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border border-telegram-border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-telegram-blue mr-3" />
                    <span>Payment Methods</span>
                  </div>
                  <span className="text-telegram-text-secondary">→</span>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Account</h2>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 text-error-500 border border-error-500 rounded-lg hover:bg-error-50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Order Updates</h3>
                    <p className="text-sm text-telegram-text-secondary">
                      Get notified about order status changes
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Promotions</h3>
                    <p className="text-sm text-telegram-text-secondary">
                      Receive promotional offers and discounts
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Products</h3>
                    <p className="text-sm text-telegram-text-secondary">
                      Be the first to know about new arrivals
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-white rounded-lg border border-telegram-border p-4">
              <h2 className="font-semibold text-telegram-text mb-4">Language & Region</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select className="input">
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select className="input">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
