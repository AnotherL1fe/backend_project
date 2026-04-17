import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Данные с бэкенда
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    activeTickets: 0,
    closedTickets: 0
  });

  const isAdmin = user?.role === 'ADMIN';
  const backendUrl = 'http://localhost:3001';

  // Загрузка данных при монтировании и смене вкладки
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'tickets':
          await loadTickets();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'posts':
          await loadPosts();
          break;
      }
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/tickets/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        // Демо данные для разработки
        setTickets([
          {
            id: 1,
            subject: 'Проблема с авторизацией',
            status: 'OPEN',
            priority: 'high',
            createdAt: new Date().toISOString(),
            user: { username: 'user1' },
            _count: { messages: 3 }
          },
          {
            id: 2,
            subject: 'Вопрос по оплате',
            status: 'OPEN',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            user: { username: 'user2' },
            _count: { messages: 5 }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // Демо данные
        setUsers([
          { id: 1, username: 'admin', email: 'admin@example.com', role: 'ADMIN', createdAt: new Date().toISOString(), _count: { posts: 10 } },
          { id: 2, username: 'user1', email: 'user1@example.com', role: 'USER', createdAt: new Date().toISOString(), _count: { posts: 5 } }
        ]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        // Демо данные
        setPosts([
          { id: 1, title: 'Первый пост', content: 'Содержание поста...', createdAt: new Date().toISOString(), author: { username: 'user1' } }
        ]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${backendUrl}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        showMessage(`Тикет ${newStatus === 'CLOSED' ? 'закрыт' : 'открыт'}`, 'success');
        await loadTickets();
        await loadStats();
      } else {
        showMessage('Ошибка обновления статуса', 'error');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showMessage('Ошибка обновления статуса', 'error');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showMessage('Пользователь удален', 'success');
        await loadUsers();
        await loadStats();
      } else {
        showMessage('Ошибка удаления пользователя', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Ошибка удаления пользователя', 'error');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showMessage('Пост удален', 'success');
        await loadPosts();
        await loadStats();
      } else {
        showMessage('Ошибка удаления поста', 'error');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showMessage('Ошибка удаления поста', 'error');
    }
  };

  const openTicketChat = (ticketId) => {
    navigate(`/chat/${ticketId}`);
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Доступ запрещен</h2>
        <p>У вас нет прав для доступа к админ-панели</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    return status === 'OPEN' 
      ? <span className="status-badge active">🟢 Открыт</span>
      : <span className="status-badge completed">🔴 Закрыт</span>;
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

      {message.text && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Пользователи</h3>
            <p>{stats.totalUsers || users.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Посты</h3>
            <p>{stats.totalPosts || posts.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Активные тикеты</h3>
            <p>{stats.activeTickets || tickets.filter(t => t.status === 'OPEN').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Завершенные</h3>
            <p>{stats.closedTickets || tickets.filter(t => t.status === 'CLOSED').length}</p>
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
                      <h3>#{ticket.id} - {ticket.subject}</h3>
                      <div className="ticket-badges">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                    <div className="ticket-meta">
                      <span>👤 {ticket.user?.username || ticket.userId}</span>
                      <span>📅 {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>💬 {ticket._count?.messages || 0} сообщений</span>
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <button 
                      className="view-btn"
                      onClick={() => openTicketChat(ticket.id)}
                    >
                      💬 Перейти в чат
                    </button>
                    {ticket.status === 'OPEN' ? (
                      <button 
                        className="complete-btn"
                        onClick={() => updateTicketStatus(ticket.id, 'CLOSED')}
                      >
                        ✅ Закрыть тикет
                      </button>
                    ) : (
                      <button 
                        className="activate-btn"
                        onClick={() => updateTicketStatus(ticket.id, 'OPEN')}
                      >
                        🔄 Открыть тикет
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
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th>Постов</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td>{userItem.id}</td>
                      <td>{userItem.username}</td>
                      <td>{userItem.email}</td>
                      <td>{userItem.role === 'ADMIN' ? '👑 Админ' : '👤 Пользователь'}</td>
                      <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                      <td>{userItem._count?.posts || 0}</td>
                      <td>
                        {userItem.role !== 'ADMIN' && (
                          <button 
                            className="delete-btn"
                            onClick={() => deleteUser(userItem.id)}
                            title="Удалить пользователя"
                          >
                            🗑️
                          </button>
                        )}
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
                      Автор: {post.author?.username || post.userId} | 
                      Дата: {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <p className="post-preview">{post.content?.substring(0, 150)}...</p>
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