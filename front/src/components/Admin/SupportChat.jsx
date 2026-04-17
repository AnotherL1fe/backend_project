import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useChatSocket } from './useChatSocket';
import './SupportChat.css';

const SupportChat = () => {
  const { ticketId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.email === '';

  const backendUrl = 'http://localhost:3001';

  // Проверка наличия ticketId и редирект
  useEffect(() => {
    if (!ticketId) {
      if (isAdmin) {
        navigate('/admin/tickets');
      } else {
        navigate('/tickets');
      }
    }
  }, [ticketId, isAdmin, navigate]);

  // Генерируем комнату только если есть ticketId
  const defaultRoom = useMemo(() => {
    if (ticketId) {
      return `ticket_${ticketId}`;
    }
    return null;
  }, [ticketId]);

  const [room, setRoom] = useState(defaultRoom);
  const [nickname, setNickname] = useState(user?.username || 'user');
  const [text, setText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);

  const { status, error, messages, connect, disconnect, sendMessage } = useChatSocket(backendUrl);

  const messagesEndRef = useRef(null);

  const connected = status === 'connected';
  const connecting = status === 'connecting';

  // Загрузка информации о тикете
  useEffect(() => {
    if (ticketId) {
      fetchTicketInfo();
    }
  }, [ticketId]);

  const fetchTicketInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTicketInfo(data);
      }
    } catch (error) {
      console.error('Error fetching ticket info:', error);
    }
  };

  // Автоподключение при загрузке
  useEffect(() => {
    if (user && room && !connected && !connecting && !isConnecting) {
      setIsConnecting(true);
      const normalizedRoom = room.trim();
      const normalizedNickname = nickname.trim();

      if (normalizedRoom && normalizedNickname) {
        console.log('Auto-connecting to ticket chat:', { 
          room: normalizedRoom, 
          nickname: normalizedNickname,
          ticketId 
        });
        connect({ room: normalizedRoom, nickname: normalizedNickname });
      }
      setIsConnecting(false);
    }

    return () => {
      if (connected) {
        disconnect();
      }
    };
  }, [user, room, nickname, connect, disconnect, connected, connecting, isConnecting, ticketId]);

  // Скролл к новым сообщениям
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  const handleManualConnect = () => {
    const normalizedRoom = room.trim();
    const normalizedNickname = nickname.trim();

    if (!normalizedRoom || !normalizedNickname) {
      return;
    }

    connect({ room: normalizedRoom, nickname: normalizedNickname });
  };

  const handleSend = () => {
    const payload = text.trim();
    if (!payload) return;

    sendMessage(payload);
    setText('');
  };

  const handleBack = () => {
    if (connected) {
      disconnect();
    }
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/tickets');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Показываем загрузку, если нет ticketId
  if (!ticketId) {
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
            Перенаправление...
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
          {!connected && !connecting && !isConnecting && (
            <div className="connection-controls">
              <div className="connect-form">
                <div className="connect-field">
                  <label>Никнейм</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={user?.username || 'user'}
                  />
                </div>
                <button
                  className="connect-btn"
                  onClick={handleManualConnect}
                  disabled={!nickname.trim()}
                >
                  Подключиться к чату
                </button>
              </div>
            </div>
          )}

          {(connecting || isConnecting) && (
            <div className="connecting-message">
              <div className="spinner-small"></div>
              <span>Подключение к чату...</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
              <button onClick={handleManualConnect} className="retry-btn">
                Попробовать снова
              </button>
            </div>
          )}

          {connected && (
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
        </div>

        <div className="chat-footer-hint">
          💡 Поддержка ответит в ближайшее время. Пожалуйста, описывайте проблему подробно.
        </div>
      </div>
    </div>
  );
};

export default SupportChat;