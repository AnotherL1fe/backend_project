import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import TicketChat from './TicketChat';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Данные будут загружаться с бэкенда
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tickets, setTickets] = useState([]);

  const isAdmin = user?.role === 'ADMIN';

  const updateTicketStatus = (ticketId, newStatus) => {
    // Будет вызван API
    console.log('Update ticket status:', ticketId, newStatus);
  };

  const deleteUser = (userId) => {
    // Будет вызван API
    console.log('Delete user:', userId);
  };

  const deletePost = (postId) => {
    // Будет вызван API
    console.log('Delete post:', postId);
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Доступ запрещен</h2>
        <p>У вас нет прав для доступа к админ-панели</p>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <TicketChat 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className="status-badge active">🟢 Активный</span>
      : <span className="status-badge completed">🔴 Завершен</span>;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: <span className="priority-badge low">🟢 Низкий</span>,
      medium: <span className="priority-badge medium">🟡 Средний</span>,
      high: <span className="priority-badge high">🔴 Высокий</span>
    };
    return badges[priority] || badges.medium;
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👑 Админ-панель</h1>
        <p>Управление пользователями, контентом и тикетами</p>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Пользователи</h3>
            <p>{users.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Посты</h3>
            <p>{posts.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Активные тикеты</h3>
            <p>{tickets.filter(t => t.status === 'active').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Завершенные</h3>
            <p>{tickets.filter(t => t.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Тикеты ({tickets.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Посты ({posts.length})
        </button>
      </div>

      <div className="admin-content">
        {/* Тикеты */}
        {activeTab === 'tickets' && (
          <div className="tickets-list">
            {loading ? (
              <div className="loading">Загрузка тикетов...</div>
            ) : tickets.length === 0 ? (
              <div className="no-data">Нет тикетов</div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="ticket-item">
                  <div className="ticket-info">
                    <div className="ticket-header">
                      <h3>{ticket.title}</h3>
                      <div className="ticket-badges">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                    <p className="ticket-content">{ticket.content?.substring(0, 100)}</p>
                    <div className="ticket-meta">
                      <span>👤 {ticket.user?.username}</span>
                      <span>📅 {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>💬 {ticket._count?.messages || 0} сообщений</span>
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <button 
                      className="view-btn"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      💬 Перейти в чат
                    </button>
                    {ticket.status === 'active' ? (
                      <button 
                        className="complete-btn"
                        onClick={() => updateTicketStatus(ticket.id, 'completed')}
                      >
                        ✅ Завершить тикет
                      </button>
                    ) : (
                      <button 
                        className="activate-btn"
                        onClick={() => updateTicketStatus(ticket.id, 'active')}
                      >
                        🔄 Активировать
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="users-table-container">
            {loading ? (
              <div className="loading">Загрузка пользователей...</div>
            ) : users.length === 0 ? (
              <div className="no-data">Нет пользователей</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Дата регистрации</th>
                    <th>Постов</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{user._count?.posts || 0}</td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteUser(user.id)}
                          title="Удалить пользователя"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Посты */}
        {activeTab === 'posts' && (
          <div className="posts-list">
            {loading ? (
              <div className="loading">Загрузка постов...</div>
            ) : posts.length === 0 ? (
              <div className="no-data">Нет постов</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="post-item">
                  <div className="post-info">
                    <h3>{post.title}</h3>
                    <p className="post-meta">
                      Автор: {post.author?.username} | 
                      Дата: {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <p className="post-preview">{post.content?.substring(0, 100)}...</p>
                  </div>
                  <div className="post-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => deletePost(post.id)}
                      title="Удалить пост"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;