// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to prevent flashing

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, status } = await apiRequest('/auth/me');
        console.log(data);
        if (status === 401) {
          console.log('Miissing cookie, user not authenticated');
          setUser(null);
        }
        else{
        setUser(data.user); // Store user data (role and name)
        }
        console.log(user);
      } catch (error) {
        console.error('User not authenticated');
        setUser(null); // Ensure user is null if authentication fails
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  const login = async (payload) => {
    try {
      const response = await apiRequest('/login', 'POST', payload);
      if (response.status === 200) {
        // Assuming your response contains user data
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  };
  const GuestLogin = async (payload) => {
    try {
      const response = await apiRequest('/guest/login', 'POST', payload);
      if (response.status === 200) {
        // Assuming your response contains user data
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  }
  const logout = async () => {
    try {
      await apiRequest('/logout', 'POST', null, {
        'X-CSRF-TOKEN': getCookie('csrf_access_token'),
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 10);
    }
  };
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, GuestLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
