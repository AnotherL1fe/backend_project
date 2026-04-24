import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Данные с бэкенда
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalTickets: 0,
    activeTickets: 0,
    closedTickets: 0
  });

  const isAdmin = user?.role === 'ADMIN';
  const backendUrl = 'http://localhost:3001';

  // Загрузка данных при монтировании и смене вкладки
  useEffect(() => {
    if (isAdmin && token) {
      loadData();
    }
  }, [activeTab, isAdmin, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Всегда загружаем статистику
      await loadStats();
      
      // Загружаем данные в зависимости от вкладки
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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        console.log('Stats loaded:', data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ИСПРАВЛЕНО: правильный эндпоинт для пользователей
  const loadUsers = async () => {
    try {
      console.log('Loading users from database...');
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Обрабатываем ответ - может быть { users: [...] } или просто массив
        const usersData = data.users || data;
        setUsers(usersData);
        console.log('Users loaded:', usersData.length);
      } else {
        console.error('Failed to load users:', response.status);
        const error = await response.json();
        showMessage(error.error || 'Ошибка загрузки пользователей', 'error');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Ошибка подключения к серверу', 'error');
      setUsers([]);
    }
  };

  // ИСПРАВЛЕНО: правильный эндпоинт для тикетов
  const loadTickets = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const ticketsData = data.tickets || data;
        setTickets(ticketsData);
        console.log('Tickets loaded:', ticketsData.length);
      } else {
        console.error('Failed to load tickets:', response.status);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    }
  };

  // ИСПРАВЛЕНО: правильный эндпоинт для постов
  const loadPosts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const postsData = data.posts || data;
        setPosts(postsData);
        console.log('Posts loaded:', postsData.length);
      } else {
        console.error('Failed to load posts:', response.status);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        showMessage(`Тикет ${newStatus === 'CLOSED' ? 'закрыт' : 'открыт'}`, 'success');
        await loadTickets();
        await loadStats();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Ошибка обновления статуса', 'error');
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
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showMessage('Пользователь удален', 'success');
        await loadUsers();
        await loadStats();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Ошибка удаления пользователя', 'error');
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
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showMessage('Пост удален', 'success');
        await loadPosts();
        await loadStats();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Ошибка удаления поста', 'error');
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
      LOW: <span className="priority-badge low">🟢 Низкий</span>,
      MEDIUM: <span className="priority-badge medium">🟡 Средний</span>,
      HIGH: <span className="priority-badge high">🔴 Высокий</span>
    };
    return badges[priority] || badges.MEDIUM;
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
            <h3>Всего тикетов</h3>
            <p>{stats.totalTickets || tickets.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Активные тикеты</h3>
            <p>{stats.activeTickets || tickets.filter(t => t.status === 'OPEN').length}</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
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
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Тикеты ({tickets.length})
        </button>
      </div>

      <div className="admin-content">
        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="users-table-container">
            {loading ? (
              <div className="loading">Загрузка пользователей из базы данных...</div>
            ) : users.length === 0 ? (
              <div className="no-data">
                <p>Нет пользователей в базе данных</p>
                <button onClick={loadUsers} className="refresh-btn">Обновить</button>
              </div>
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
                    <th>Тикетов</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td>{userItem.id}</td>
                      <td>{userItem.username}</td>
                      <td>{userItem.email}</td>
                      <td>
                        <span className={`role-badge ${userItem.role?.toLowerCase()}`}>
                          {userItem.role === 'ADMIN' ? '👑 Админ' : '👤 Пользователь'}
                        </span>
                      </td>
                      <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                      <td>{userItem._count?.posts || 0}</td>
                      <td>{userItem._count?.tickets || 0}</td>
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
                        {userItem.role === 'ADMIN' && (
                          <span className="admin-protected" title="Администратора нельзя удалить">🔒</span>
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
                    {ticket.description && (
                      <p className="ticket-description">{ticket.description.substring(0, 100)}</p>
                    )}
                    <div className="ticket-meta">
                      <span>👤 {ticket.author?.username || ticket.user?.username || ticket.userId}</span>
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
      </div>
    </div>
  );
};

export default AdminPanel;