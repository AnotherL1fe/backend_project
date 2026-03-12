import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const getTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'ref_token') {
      return value;
    }
  }
  return null;
};

const removeTokenCookie = () => {
  document.cookie = 'ref_token=; Max-Age=-99999999; path=/;';
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      },

      register: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      },

      logout: () => {
        removeTokenCookie();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      checkAuth: async () => {
        const token = getTokenFromCookie();
        
        if (token) {
          try {
            const response = await fetch('http://localhost:3001/api/auth/me', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (response.ok) {
              const data = await response.json();
              set({ 
                user: data.user, 
                token, 
                isAuthenticated: true,
                isLoading: false 
              });
            } else {
              removeTokenCookie();
              set({ 
                user: null, 
                token: null, 
                isAuthenticated: false,
                isLoading: false 
              });
            }
          } catch (error) {
            console.error('Auth check error:', error);
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user
      }),
    }
  )
);

useAuthStore.getState().checkAuth();

export default useAuthStore;