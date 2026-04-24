// components/UserCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './UserCard.css';

const UserCard = ({ user, onDelete, onEdit, isAdmin = false }) => {
  // Функция для получения инициалов
  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Дата не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Получение цвета для аватара в зависимости от роли
  const getAvatarColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return '#dc3545'; // красный для админа
      case 'MANAGER':
        return '#ffc107'; // желтый для менеджера
      default:
        return '#000000'; // синий для обычного пользователя
    }
  };

  // Получение значка роли
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="role-badge admin">👑 Админ</span>;
      case 'MANAGER':
        return <span className="role-badge manager">⭐ Менеджер</span>;
      default:
        return <span className="role-badge user">👤 Пользователь</span>;
    }
  };

  return (
    <div className={`user-card ${user.role === 'ADMIN' ? 'admin-card' : ''}`}>
      <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.role) }}>
        <span>{getInitials(user.username || user.name)}</span>
      </div>
      
      <div className="user-info">
        <div className="user-name-section">
          <h3 className="user-name">{user.username || user.name}</h3>
          {getRoleBadge(user.role)}
        </div>
        
        <p className="user-email">📧 {user.email}</p>
        
        <div className="user-stats">
          <div className="stat">
            <span className="stat-label">📝 Постов:</span>
            <span className="stat-value">{user._count?.posts || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">📅 Регистрация:</span>
            <span className="stat-value">{formatDate(user.createdAt)}</span>
          </div>
        </div>
        
        {user.lastActive && (
          <p className="user-last-active">🟢 Был(а) в сети: {formatDate(user.lastActive)}</p>
        )}
      </div>
      
      <div className="user-actions">
        <Link to={`/user/${user.id}`} className="view-details-btn">
          Подробнее
        </Link>
      </div>
    </div>
  );
};

export default UserCard;