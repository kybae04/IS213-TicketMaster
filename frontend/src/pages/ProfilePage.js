import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || 'User',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would update the user profile
    // For now, just toggle editing mode
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="p-8 bg-gray-50 dark:bg-gray-700 md:w-80">
            <div className="text-center mb-6">
              <div className="h-32 w-32 rounded-full bg-yellow-500 flex items-center justify-center text-white text-4xl font-bold mx-auto">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{formData.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{formData.email}</p>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="w-full font-medium"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              
              <Button
                onClick={logout}
                variant="default"
                className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                Logout
              </Button>
            </div>
          </div>
          
          <div className="p-8 md:flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {isEditing ? 'Edit Profile' : 'Profile Information'}
            </h1>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full font-semibold"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{formData.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</h3>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{formData.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</h3>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {formData.phone || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                    {formData.address || 'Not provided'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 