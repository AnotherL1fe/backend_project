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
      isAuthenticated: false,
      isLoading: true,

      login: (userData, token) => {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
      },

      register: (userData, token) => {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
      },

      logout: () => {
        removeTokenCookie();
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      checkAuth: async () => {
<<<<<<< HEAD
        
=======
        // const token = getTokenFromCookie();
        
        // if (token) {
>>>>>>> 02f4630a63357cf40a04cd0c970dbb47c7bb37a7
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
<<<<<<< HEAD
                user: data.user,
=======
                user: data.user, 
>>>>>>> 02f4630a63357cf40a04cd0c970dbb47c7bb37a7
                isAuthenticated: true,
                isLoading: false 
              });
              console.log(21431);
              
            } else {
<<<<<<< HEAD
=======
              // removeTokenCookie();
>>>>>>> 02f4630a63357cf40a04cd0c970dbb47c7bb37a7
              set({ 
                user: null, 
                isAuthenticated: false,
                isLoading: false 
              });
            }
          } catch (error) {
            console.error('Auth check error:', error);
            
          }
<<<<<<< HEAD
=======
         finally {
          set({ isLoading: false });
        }
>>>>>>> 02f4630a63357cf40a04cd0c970dbb47c7bb37a7
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