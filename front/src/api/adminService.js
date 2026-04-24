const API_URL = 'http://localhost:3001/api';

class AdminService {
  // Получить всех пользователей из БД
  async getUsers(token) {
    try {
      console.log('Fetching users from backend...');
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка загрузки пользователей');
      }

      const data = await response.json();
      console.log('Users loaded:', data.users);
      return data.users || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  // Получить пользователя по ID
  async getUserById(id, token) {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки пользователя');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  }

  // Обновить пользователя
  async updateUser(id, userData, token) {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления пользователя');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  // Удалить пользователя
  async deleteUser(id, token) {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления пользователя');
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  // Получить статистику
  async getStats(token) {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        totalUsers: 0,
        totalPosts: 0,
        totalTickets: 0,
        openTickets: 0
      };
    }
  }
}

export default new AdminService();