// pages/UserDetailPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useDataStore from '../store/dataStore';
import useAuthStore from '../store/authStore';
import Spinner from '../components/UI/Spinner';
import './UserDetailPage.css';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  
  // Получаем данные из стора
  const users = useDataStore((state) => state.users);
  const isLoading = useDataStore((state) => state.isLoading);
  const fetchUsers = useDataStore((state) => state.fetchUsers);
  const getUserById = useDataStore((state) => state.getUserById);
  
  // Получаем пользователя по ID
  const user = getUserById(id);
  
  useEffect(() => {
    // Если пользователи еще не загружены, загружаем их
    if (token && (!users || users.length === 0)) {
      fetchUsers(token);
    }
  }, [token, users]);

  console.log('UserDetailPage:', { id, user, users, isLoading });

  if (isLoading && !user) {
    return <Spinner />;
  }

  if (!user) {
    return (
      <div className="user-not-found">
        <h2>Пользователь не найден</h2>
        <p>Пользователь с ID {id} не существует</p>
        <Link to="/users">← Вернуться к списку</Link>
      </div>
    );
  }

  return (
    <div className="user-detail-page">
      <Link to="/users" className="back-link-post">← Назад к пользователям</Link>
      
      <div className="user-profile">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.username?.charAt(0) || '?'}</span>
          </div>
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p>📧 {user.email}</p>
            <p>👑 Роль: {user.role}</p>
            <p>📅 Зарегистрирован: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-value">{user._count?.posts || 0}</div>
            <div className="stat-label">Постов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user._count?.tickets || 0}</div>
            <div className="stat-label">Тикетов</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;