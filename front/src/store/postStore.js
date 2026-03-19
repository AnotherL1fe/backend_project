import { create } from 'zustand';

const API_URL = 'http://localhost:3001';

const usePostStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,

  // Получить все посты
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts');
      }
      
      set({ posts: data.posts, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Получить пост по ID
  fetchPostById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch post');
      }
      
      set({ currentPost: data.post, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Создать новый пост
  createPost: async (postData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }
      
      // Обновляем список постов
      const { posts } = get();
      set({ 
        posts: [data.post, ...posts], 
        isLoading: false 
      });
      
      return { success: true, post: data.post };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Обновить пост
  updatePost: async (id, postData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update post');
      }
      
      // Обновляем пост в списке
      const { posts } = get();
      const updatedPosts = posts.map(p => 
        p.id === id ? data.post : p
      );
      
      set({ 
        posts: updatedPosts,
        currentPost: data.post,
        isLoading: false 
      });
      
      return { success: true, post: data.post };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Удалить пост
  deletePost: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post');
      }
      
      // Удаляем пост из списка
      const { posts } = get();
      set({ 
        posts: posts.filter(p => p.id !== id),
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Получить посты пользователя
  fetchUserPosts: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/posts/user/${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user posts');
      }
      
      set({ posts: data.posts, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Очистить ошибку
  clearError: () => set({ error: null })
}));

export default usePostStore;