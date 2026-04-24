// hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { BASEURL as API_URL } from '../api';

export const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    login: storeLogin, 
    logout: storeLogout,
    setLoading: setStoreLoading 
  } = useAuthStore();
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Конфигурация axios для добавления токена
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Также сохраняем в localStorage для возможности восстановления
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      setStoreLoading(true);
      
      // Пытаемся восстановить токен из localStorage
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && !token) {
        try {
          // Проверяем валидность сохраненного токена
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          
          if (response.data && response.data.user) {
            storeLogin(response.data.user, savedToken);
            console.log('Auth restored from localStorage');
          } else {
            // Токен невалидный
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            storeLogout();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          storeLogout();
        }
      } else if (token) {
        // Уже есть токен в store, проверяем его
        try {
          const response = await axios.get(`${API_URL}/auth/me`);
          if (!response.data || !response.data.user) {
            storeLogout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          storeLogout();
        }
      }
      
      setStoreLoading(false);
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []); // Запускаем только при монтировании

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      if (response.data && response.data.user && response.data.token) {
        // Сохраняем в store
        storeLogin(response.data.user, response.data.token);
        // Сохраняем в localStorage для восстановления
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return { success: true, user: response.data.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Ошибка при входе. Проверьте данные и попробуйте снова';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data && response.data.user && response.data.token) {
        // Автоматически входим после регистрации
        storeLogin(response.data.user, response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return { success: true, user: response.data.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Ошибка при регистрации. Попробуйте снова';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    storeLogout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setAuthError('');
  };

  // Обновление профиля пользователя
  const updateProfile = async (userData) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, userData);
      
      if (response.data && response.data.user) {
        // Обновляем пользователя в store
        storeLogin(response.data.user, token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка обновления профиля';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  // Смена пароля
  const changePassword = async (oldPassword, newPassword) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        oldPassword,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка смены пароля';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading: authLoading,
    isCheckingAuth,
    error: authError,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile,
    changePassword,
    clearError: () => setAuthError('')
  };
};