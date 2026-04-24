// store/dataStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import adminService from '../api/adminService'; // 👈 ДОБАВЬТЕ ЭТОТ ИМПОРТ

const STORAGE_KEY = 'data-visualizer-store';

const useDataStore = create(
  persist(
    (set, get) => ({
      // Состояние
      users: [],
      posts: {},
      isLoading: false,
      viewMode: 'list',
      error: null,
      lastUpdated: null,

      // Действия
      setUsers: (users) => set({ users, lastUpdated: Date.now() }),

      addPost: (userId, post) => 
        set((state) => ({
          posts: {
            ...state.posts,
            [userId]: [...(state.posts[userId] || []), post]
          }
        })),

      setPosts: (userId, posts) =>
        set((state) => ({
          posts: {
            ...state.posts,
            [userId]: posts
          }
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Загрузка пользователей из БД
      fetchUsers: async (token) => {
        const { setLoading, setUsers, setError } = get();
        
        // if (!token) {
        //   setError('Нет токена авторизации');
        //   return [];
        // }
        
        setLoading(true);
        setError(null);
        
        try {
          console.log('Fetching users from database...');
          const users = await adminService.getUsers(token);
          console.log('Users loaded:', users.length);
          setUsers(users);
          return users;
        } catch (error) {
          console.error('Error fetching users:', error);
          setError(error.message || 'Ошибка загрузки пользователей');
          return [];
        } finally {
          setLoading(false);
        }
      },

      // Загрузка постов пользователя из БД
      fetchUserPosts: async (userId, token) => {
        const { setLoading, setPosts, setError } = get();
        
        setLoading(true);
        setError(null);
        
        try {
          const posts = await adminService.getUserPosts(userId, token);
          setPosts(userId, posts);
          return posts;
        } catch (error) {
          console.error('Error fetching user posts:', error);
          setError(error.message || 'Ошибка загрузки постов');
          return [];
        } finally {
          setLoading(false);
        }
      },

      // Загрузка всех данных (пользователи + их посты)
      fetchAllData: async (token) => {
        const { fetchUsers, fetchUserPosts } = get();
        
        try {
          const loadedUsers = await fetchUsers(token);
          
          // Загружаем посты для каждого пользователя
          const postsPromises = loadedUsers.map(user => 
            fetchUserPosts(user.id, token).catch(err => {
              console.error(`Error loading posts for user ${user.id}:`, err);
              return [];
            })
          );
          
          await Promise.all(postsPromises);
          
          return { users: loadedUsers, success: true };
        } catch (error) {
          console.error('Error fetching all data:', error);
          return { success: false, error: error.message };
        }
      },

      // Обновить пользователя
      updateUser: async (userId, userData, token) => {
        const { setError, fetchUsers } = get();
        
        try {
          const updatedUser = await adminService.updateUser(userId, userData, token);
          // Обновляем список пользователей
          await fetchUsers(token);
          return updatedUser;
        } catch (error) {
          console.error('Error updating user:', error);
          setError(error.message || 'Ошибка обновления пользователя');
          throw error;
        }
      },

      // Удалить пользователя
      deleteUser: async (userId, token) => {
        const { setError, fetchUsers, removeUserFromCache } = get();
        
        try {
          await adminService.deleteUser(userId, token);
          // Удаляем из кеша
          removeUserFromCache(userId);
          // Обновляем список пользователей
          await fetchUsers(token);
          return true;
        } catch (error) {
          console.error('Error deleting user:', error);
          setError(error.message || 'Ошибка удаления пользователя');
          throw error;
        }
      },

      // Проверка наличия данных в кеше
      hasUsers: () => {
        const { users } = get();
        return users && users.length > 0;
      },

      hasUserPosts: (userId) => {
        const { posts } = get();
        return !!posts[userId];
      },

      // Получение данных
      getUserById: (id) => {
        const { users } = get();
        const userId = typeof id === 'string' ? parseInt(id) : id;
        return users.find(user => user.id === userId);
      },

      getPostsByUserId: (userId) => {
        const { posts } = get();
        return posts[userId] || [];
      },

      // Очистка кеша
      clearCache: () => set({
        users: [],
        posts: {},
        isLoading: false,
        viewMode: 'list',
        error: null,
        lastUpdated: null
      }),

      // Очистка только постов
      clearPostsCache: () => set({ posts: {} }),

      // Удалить конкретного пользователя из кеша
      removeUserFromCache: (userId) =>
        set((state) => {
          const newPosts = { ...state.posts };
          delete newPosts[userId];
          return { posts: newPosts };
        }),

      // Обновить кеш (принудительно)
      refreshCache: async (token) => {
        const { clearCache, fetchAllData } = get();
        clearCache();
        return await fetchAllData(token);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Исключаем isLoading и error из сохранения
      partialize: (state) => ({
        users: state.users,
        posts: state.posts,
        viewMode: state.viewMode,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);

export default useDataStore;