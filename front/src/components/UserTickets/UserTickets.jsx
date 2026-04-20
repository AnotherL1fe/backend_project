import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
// import { Ticket } from './ticketTypes'
import './UserTickets.css';

const UserTickets = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    priority: 'medium',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const backendUrl = 'http://localhost:3001';

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${backendUrl}/api/tickets/my`, {
        method: 'GET',
        credentials: 'include', // 👈 ВАЖНО: отправляем куки
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else if (response.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        // Перенаправляем на логин через 2 секунды
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Ошибка загрузки тикетов');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Не удалось загрузить тикеты. Проверьте подключение к серверу.');
      // Демо данные для разработки
      setTickets([
        {
          id: 1,
          subject: 'Проблема с авторизацией',
          status: 'OPEN',
          priority: 'high',
          description: 'Не могу войти в аккаунт',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { messages: 3 }
        },
        {
          id: 2,
          subject: 'Вопрос по оплате',
          status: 'CLOSED',
          priority: 'medium',
          description: 'Когда спишутся средства?',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString(),
          _count: { messages: 5 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim()) {
      setError('Введите тему обращения');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/tickets`, {
        method: 'POST',
        credentials: 'include', // 👈 ВАЖНО: отправляем куки
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          priority: newTicket.priority,
          description: newTicket.description
        })
      });

      if (response.ok) {
        const ticket = await response.json();
        setShowCreateForm(false);
        setNewTicket({ subject: '', priority: 'medium', description: '' });
        navigate(`/chat/${ticket.id}`);
      } else if (response.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка создания тикета');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Не удалось создать тикет. Попробуйте позже.');
      
      // Для демо - создаем фейковый тикет и переходим в чат
      const fakeTicket = {
        id: Date.now(),
        subject: newTicket.subject,
        status: 'OPEN',
        priority: newTicket.priority,
        createdAt: new Date().toISOString()
      };
      navigate(`/chat/${fakeTicket.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketChat = (ticketId) => {
    navigate(`/chat/${ticketId}`);
  };

  const getStatusBadge = (status) => {
    return status === 'OPEN' 
      ? <span className="status-badge open">🟢 Открыт</span>
      : <span className="status-badge closed">🔴 Закрыт</span>;
  };

const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'low':
      return <span className="priority-badge low">🟢 Низкий</span>;
    case 'high':
      return <span className="priority-badge high">🔴 Высокий</span>;
    default:
      return <span className="priority-badge medium">🟡 Средний</span>;
  }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Вчера в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  if (!user) {
    return (
      <div className="user-tickets">
        <div className="error-container">
          <h2>Доступ запрещен</h2>
          <p>Пожалуйста, войдите в систему</p>
          <button onClick={() => navigate('/login')} className="login-btn">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-tickets">
      <div className="tickets-header">
        <div>
          <h1>Мои обращения</h1>
          <p>Управляйте своими тикетами и обращайтесь в поддержку</p>
        </div>
        <button 
          className="create-ticket-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Новое обращение
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={loadTickets} className="retry-btn">Повторить</button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка обращений...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>У вас пока нет обращений</h3>
          <p>Создайте новое обращение в службу поддержки</p>
          <button onClick={() => setShowCreateForm(true)} className="empty-create-btn">
            Создать обращение
          </button>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div 
              key={ticket.id} 
              className={`ticket-card ${ticket.status === 'CLOSED' ? 'closed' : 'open'}`}
              onClick={() => openTicketChat(ticket.id)}
            >
              <div className="ticket-header">
                <div className="ticket-title">
                  <h3>#{ticket.id} - {ticket.subject}</h3>
                  <div className="ticket-badges">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
                <div className="ticket-date">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>
              
              {ticket.description && (
                <div className="ticket-description">
                  {ticket.description.length > 100 
                    ? ticket.description.substring(0, 100) + '...' 
                    : ticket.description}
                </div>
              )}
              
              <div className="ticket-footer">
                <div className="ticket-meta">
                  <span>💬 {ticket._count?.messages || 0} сообщений</span>
                  <span>🔄 Обновлен: {formatDate(ticket.updatedAt)}</span>
                </div>
                <button className="chat-button">
                  Перейти в чат →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно создания тикета */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новое обращение</h2>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            
            <form onSubmit={createTicket}>
              <div className="form-group">
                <label htmlFor="subject">Тема обращения *</label>
                <input
                  id="subject"
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  placeholder="Кратко опишите проблему"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Приоритет</label>
                <select
                  id="priority"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                >
                  <option value="low">🟢 Низкий - Не срочно</option>
                  <option value="medium">🟡 Средний - Обычная важность</option>
                  <option value="high">🔴 Высокий - Срочная проблема</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Описание проблемы</label>
                <textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Подробно опишите вашу проблему. Это поможет нам быстрее вам помочь."
                  rows={5}
                />
              </div>
              
              <div className="form-hint">
                💡 После создания обращения вы будете перенаправлены в чат поддержки
              </div>
              
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-btn"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting || !newTicket.subject.trim()}
                >
                  {submitting ? 'Создание...' : 'Создать обращение'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTickets;