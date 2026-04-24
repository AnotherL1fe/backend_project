// components/UserList.jsx
import React, { useEffect } from 'react';
import useDataStore from '../../store/dataStore';
import useAuthStore from '../../store/authStore';
import UserCard from './UserCard';
import './UserList.css';

const UserList = () => {
  // Получаем данные из стора
  const users = useDataStore((state) => state.users);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchUsers = useDataStore((state) => state.fetchUsers);
  const hasUsers = useDataStore((state) => state.hasUsers);
  
  const { token, user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (token && isAdmin) {
      console.log('Loading users...');
      fetchUsers(token);
    }
  }, [token, isAdmin]);

  // Отладка
  console.log('UserList render:', { users, isLoading, error, token });

  // if (!token) {
  //   return <div className="alert">Необходимо авторизоваться</div>;
  // }

  // if (!isAdmin) {
  //   return <div className="alert">Доступ запрещен. Только для администраторов</div>;
  // }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка пользователей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>❌ {error}</p>
        <button onClick={() => fetchUsers(token)}>Повторить</button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="empty-container">
        <p>📭 Нет пользователей в базе данных</p>
        <button onClick={() => fetchUsers(token)}>Обновить</button>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h2>👥 Пользователи ({users.length})</h2>
        {/* <button onClick={() => fetchUsers(token)} className="refresh-btn">
          🔄 Обновить
        </button> */}
      </div>
      
      <div className="users-grid">
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList;