// front/src/components/SupportChat/SupportChat.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useChatSocket } from '../../hooks/useChatSocket';
import './SupportChat.css';

const SupportChat = () => {
  const { ticketId } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const backendUrl = 'http://localhost:3001';
  const hasConnectedRef = useRef(false);
  const componentMounted = useRef(true);

  const room = useMemo(() => {
    if (ticketId) {
      return `ticket_${ticketId}`;
    }
    return null;
  }, [ticketId]);

  const nickname = user?.username || 'user';
  const [text, setText] = useState('');
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { status, error, messages, connect, disconnect, sendMessage, isConnected } = useChatSocket(backendUrl);

  const messagesEndRef = useRef(null);
  const connected = status === 'connected';
  const connecting = status === 'connecting';

  // Редирект если нет ticketId
  useEffect(() => {
    if (!ticketId) {
      navigate(isAdmin ? '/admin/tickets' : '/tickets');
    }
  }, [ticketId, isAdmin, navigate]);

  // Загрузка информации о тикете
  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketInfo = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/tickets/${ticketId}`, {
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (componentMounted.current) {
            setTicketInfo(data);
          }
        }
      } catch (error) {
        console.error('Error fetching ticket info:', error);
      } finally {
        if (componentMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchTicketInfo();
  }, [ticketId, backendUrl]);

useEffect(() => {
  // Отладка - проверяем все места где может быть токен
  const localToken = localStorage.getItem('token');
  const localAuthToken = localStorage.getItem('auth-token');
  const cookieToken = document.cookie.split('; ').find(row => row.startsWith('ref_token='))?.split('=')[1];
  
  console.log('🔍 Token check:', {
    localStorage_token: localToken,
    localStorage_auth_token: localAuthToken,
    cookie_ref_token: cookieToken,
    user: user,
    isAuthenticated: isAuthenticated
  });
  
  if (!user || !room || connected || connecting || hasConnectedRef.current || loading) {
    return;
  }

  // Проверяем наличие токена
  const token = localToken || localAuthToken;
  if (!token) {
    console.error('❌ No token found, cannot connect');
    return;
  }

  console.log('✅ Token found, auto-connecting...');
  hasConnectedRef.current = true;
  connect({ room: room.trim(), nickname, userId: user.id });
}, [user, room, nickname, connect, connected, connecting, ticketId, loading, isAuthenticated]);

  // Автоподключение - только один раз!
  useEffect(() => {
    // Ждем загрузки всех данных
    if (loading || !room || !user || !isAuthenticated) {
      return;
    }

    // Уже подключены или подключаемся
    if (connected || connecting || hasConnectedRef.current) {
      return;
    }

    console.log('Auto-connecting to ticket chat:', {
      room: room.trim(),
      nickname,
      ticketId
    });

    hasConnectedRef.current = true;
    connect({ room: room.trim(), nickname, userId: user.id });
  }, [user, room, nickname, connect, connected, connecting, ticketId, loading, isAuthenticated]);

  // Отключаемся при размонтировании
  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
      if (connected) {
        disconnect();
      }
      hasConnectedRef.current = false;
    };
  }, [disconnect, connected]);

  // Скролл к новым сообщениям
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

 const handleSend = useCallback((e) => {
    // Предотвращаем перезагрузку страницы
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const payload = text.trim();
    if (!payload || !connected || !room) {
      console.log('Cannot send:', { payload, connected, room });
      return;
    }

    console.log('Sending message:', payload);
    sendMessage(payload);
    setText('');
  }, [text, connected, sendMessage, room]);

  // Исправленный handleKeyDown
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 👈 КЛЮЧЕВОЕ: предотвращаем дефолтное поведение
      e.stopPropagation();
      handleSend();
    }
  }, [handleSend]);


  const handleBack = useCallback(() => {
    if (connected) {
      disconnect();
    }
    navigate(isAdmin ? '/admin/tickets' : '/tickets');
  }, [connected, disconnect, isAdmin, navigate]);

  const handleReconnect = useCallback(() => {
    hasConnectedRef.current = false;
    connect({ room: room.trim(), nickname, userId: user?.id });
  }, [connect, room, nickname, user?.id]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Показываем загрузку
  if (loading || !ticketId || !room) {
    return (
      <div className="support-chat">
        <div className="chat-header">
          <button className="back-btn" onClick={handleBack}>
            ← {isAdmin ? 'Вернуться к тикетам' : 'Мои тикеты'}
          </button>
          <div className="chat-title">
            <h2>Чат поддержки</h2>
          </div>
        </div>
        <div className="chat-panel">
          <div className="loading-message">
            Загрузка...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-chat">
      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          ← {isAdmin ? 'Вернуться к тикетам' : 'Мои тикеты'}
        </button>
        <div className="chat-title">
          <h2>Чат поддержки</h2>
          <div className="chat-meta">
            {ticketInfo && (
              <>
                <span>🎫 Тикет #{ticketInfo.id}</span>
                <span>📝 {ticketInfo.subject}</span>
                <span className={`status-badge ${ticketInfo.status === 'OPEN' ? 'open' : 'closed'}`}>
                  {ticketInfo.status === 'OPEN' ? '🟢 Открыт' : '🔴 Закрыт'}
                </span>
              </>
            )}
            <span>👤 {nickname}</span>
            <span className={`status-badge ${connected ? 'online' : 'offline'}`}>
              {connected ? '🟢 В чате' : connecting ? '🟡 Подключение...' : '⚫ Не в чате'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              {connected
                ? 'Чат готов к работе. Опишите вашу проблему.'
                : 'Подключение к чату...'}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSystem = msg.kind === 'system';
              const isUser = !isSystem && msg.author === nickname;

              return (
                <div
                  key={msg.id || idx}
                  className={`message ${isSystem ? 'system' : (isUser ? 'user' : 'support')}`}
                >
                  <div className="message-header">
                    <strong>{isSystem ? 'Система' : msg.author}</strong>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="message-content">{msg.text}</div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-composer">
          {error && !connecting && (
            <div className="error-message">
              ❌ {error}
              <button onClick={handleReconnect} className="retry-btn">
                Попробовать снова
              </button>
            </div>
          )}

          {connected && ticketInfo?.status === 'OPEN' && (
            <div className="chat-input-area">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите сообщение..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="send-btn"
                disabled={!connected || !text.trim()}
                onClick={handleSend}
              >
                Отправить
              </button>
            </div>
          )}

          {connected && ticketInfo?.status === 'CLOSED' && (
            <div className="chat-closed">
              <div className="closed-message">
                🔒 Тикет закрыт. Новые сообщения нельзя отправить.
              </div>
            </div>
          )}
        </div>

        <div className="chat-footer-hint">
          💡 Поддержка ответит в ближайшее время. Пожалуйста, описывайте проблему подробно.
        </div>
      </div>
    </div>
  );
};

export default SupportChat;