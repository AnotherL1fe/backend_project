// SupportChat.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useChatSocket } from '../../hooks/useChatSocket';
import './SupportChat.css';

const SupportChat = () => {
  const { ticketId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.email === '';

  const backendUrl = 'http://localhost:3001';
  const hasConnectedRef = useRef(false);

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
  const room = useMemo(() => {
    if (ticketId) {
      return `ticket_${ticketId}`;
    }
    return null;
  }, [ticketId]);

  const nickname = user?.username || 'user';
  const [text, setText] = useState('');
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
        credentials: "include",
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

  // Автоподключение при загрузке - только один раз
  useEffect(() => {
    if (!user || !room || connected || connecting || hasConnectedRef.current) {
      return;
    }

    console.log('Auto-connecting to ticket chat:', { 
      room: room.trim(), 
      nickname,
      ticketId 
    });
    
    hasConnectedRef.current = true;
    connect({ room: room.trim(), nickname });
  }, [user, room, nickname, connect, connected, connecting, ticketId]);

  // Отключаемся при размонтировании
  useEffect(() => {
    return () => {
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
    e.preventDefault();
    const payload = text.trim();
    if (!payload || !connected || !room) return;

    sendMessage(payload);
    setText('');
  }, [text, connected, sendMessage, room]);

  const handleBack = useCallback(() => {
    if (connected) {
      disconnect();
    }
    if (isAdmin) {
      navigate('/admin/tickets');
    } else {
      navigate('/tickets');
    }
  }, [connected, disconnect, isAdmin, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Показываем загрузку, если нет ticketId
  if (!ticketId || !room) {
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
          {!connected && !connecting && (
            <div className="connection-controls">
              <div className="connect-form">
                <div className="connect-field">
                  <label>Статус подключения</label>
                  <div className="connection-status">
                    {error ? 'Ошибка подключения' : 'Ожидание подключения...'}
                  </div>
                </div>
                {error && (
                  <button
                    className="connect-btn"
                    onClick={() => {
                      hasConnectedRef.current = false;
                      connect({ room: room.trim(), nickname });
                    }}
                  >
                    Попробовать снова
                  </button>
                )}
              </div>
            </div>
          )}

          {connecting && (
            <div className="connecting-message">
              <div className="spinner-small"></div>
              <span>Подключение к чату...</span>
            </div>
          )}

          {error && !connecting && (
            <div className="error-message">
              ❌ {error}
              <button 
                onClick={() => {
                  hasConnectedRef.current = false;
                  connect({ room: room.trim(), nickname });
                }} 
                className="retry-btn"
              >
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
                onKeyDown={handleKeyDown}
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
                {isAdmin && (
                  <button
                    className="reopen-btn"
                    onClick={async () => {
                      try {
                        const response = await fetch(`${backendUrl}/api/tickets/${ticketId}/status`, {
                          method: 'PATCH',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({ status: 'OPEN' })
                        });
                        if (response.ok) {
                          window.location.reload();
                        }
                      } catch (error) {
                        console.error('Error reopening ticket:', error);
                      }
                    }}
                  >
                    Открыть тикет
                  </button>
                )}
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