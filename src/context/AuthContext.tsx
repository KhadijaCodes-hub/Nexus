import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import api from '../services/api';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_STORAGE_KEY = 'business_nexus_token';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function utilizing backend API
  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { user: userData, token } = response.data;

      // Verify the user role matches
      if (userData.role !== role) {
        throw new Error('Role mismatch. You might be trying to log in as the wrong account type.');
      }
      
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred during login';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function utilizing backend API
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { user: userData, token } = response.data;
      
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred during registration';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  // Update user profile utilizing backend API
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await api.put(`/users/${userId}/profile`, updates);
      const updatedUser = response.data;
      
      // Update current user if it's the same user
      if (user?.id === userId) {
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred updating profile';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Mock forgot password function (Needs complete backend email tracking logic to implement fully)
  const forgotPassword = async (email: string): Promise<void> => {
    toast.success('Password reset functionality is under maintenance.');
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    toast.success('Password reset functionality is under maintenance.');
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};