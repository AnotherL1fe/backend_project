// frontend/src/components/SupportChat/SupportChat.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useChatSocket } from './useChatSocket';
import './SupportChat.css';

const SupportChat = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'admin@example.com';

  const backendUrl = 'http://localhost:3001';

  // Генерируем уникальную комнату для пользователя/админа
  const defaultRoom = useMemo(() => {
    if (isAdmin) return 'support_admin';
    // return `support_user_${user?.id || 'guest'}`;
    return 'support_admin'
  }, [isAdmin, user?.id]);

  const [room, setRoom] = useState(defaultRoom);
  const [nickname, setNickname] = useState(user?.username || 'user');
  const [text, setText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { status, error, messages, connect, disconnect, sendMessage } = useChatSocket(backendUrl);

  const messagesEndRef = useRef(null);

  const connected = status === 'connected';
  const connecting = status === 'connecting';

  // Автоподключение при загрузке
  useEffect(() => {
    if (user && !connected && !connecting && !isConnecting) {
      setIsConnecting(true);
      const normalizedRoom = room.trim();
      const normalizedNickname = nickname.trim();

      if (normalizedRoom && normalizedNickname) {
        console.log('Auto-connecting to chat:', { room: normalizedRoom, nickname: normalizedNickname });
        connect({ room: normalizedRoom, nickname: normalizedNickname });
      }
      setIsConnecting(false);
    }

    return () => {
      if (connected) {
        disconnect();
      }
    };
  }, [user, room, nickname, connect, disconnect, connected, connecting, isConnecting]);

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
      navigate('/');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="support-chat">
      <div className="chat-header">
        <button className="back-btn" onClick={handleBack}>
          ← {isAdmin ? 'Вернуться в админ-панель' : 'На главную'}
        </button>
        <div className="chat-title">
          <h2>Чат поддержки</h2>
          <div className="chat-meta">
            <span>👤 {nickname}</span>
            <span>📱 Комната: {room}</span>
            <span className={`status-badge ${connected ? 'online' : 'offline'}`}>
              {connected ? '🟢 Онлайн' : connecting ? '🟡 Подключение...' : '⚫ Офлайн'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              {connected ? 'Нет сообщений. Начните диалог с поддержкой.' : 'Подключение к чату...'}
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
                  <label>Комната</label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="support_room"
                  />
                </div>
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
                  disabled={!room.trim() || !nickname.trim()}
                >
                  Подключиться
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
          💡 Поддержка доступна 24/7. Опишите вашу проблему, и мы поможем!
        </div>
      </div>
    </div>
  );
};

export default SupportChat;


// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import useAuthStore from '../../store/authStore';
// import './TicketChat.css';

// const TicketChat = ({ ticket, onBack, onSendMessage }) => {
//   console.log(ticket);

//   const [messages, setMessages] = useState(ticket?.messages || []);
//   const [newMessage, setNewMessage] = useState('');
//   const [sending, setSending] = useState(false);
//   const messagesEndRef = useRef(null);
//   const { user } = useAuthStore();
//   const isAdmin = user?.role === 'ADMIN';
//   const navigate = useNavigate();

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     setSending(true);
//     // Здесь будет API вызов
//     const messageData = {
//       id: Date.now(),
//       content: newMessage,
//       authorId: 2,
//       author: { username: 'admin' },
//       createdAt: new Date().toISOString()
//     };

//     setMessages(prev => [...prev, messageData]);
//     if (onSendMessage) onSendMessage(ticket.id, newMessage);
//     setNewMessage('');
//     setSending(false);
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const formatTime = (date) => {
//     return new Date(date).toLocaleTimeString('ru-RU', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleBack = () => {
//     if (isAdmin) {
//       navigate('/admin');
//     } else {
//       navigate('/');
//     }
//   };

//   return (
//     <div className="ticket-chat">
//       <div className="chat-header">
//         <button className="back-btn" onClick={handleBack}>
//           ← {isAdmin ? 'Вернуться в админ-панель' : 'На главную'}
//         </button>
//         {/* <div className="chat-title">
//           <h2>{ticket.title}</h2>
//           <div className="chat-meta">
//             <span>👤 {ticket.user?.username}</span>
//             <span>📧 {ticket.user?.email}</span>
//           </div>
//         </div> */}
//       </div>

//       <div className="chat-messages">
//         {messages.length === 0 ? (
//           <div className="no-messages">Нет сообщений. Начните диалог с пользователем.</div>
//         ) : (
//           messages.map((msg, idx) => (
//             <div key={idx} className={`message ${msg.authorId === ticket.UserId ? 'user' : 'admin'}`}>
//               <div className="message-header">
//                 <strong>{msg.author?.username}</strong>
//                 <span className="message-time">{formatTime(msg.createdAt)}</span>
//               </div>
//               <div className="message-content">{msg.content}</div>
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       <form className="chat-input" onSubmit={handleSendMessage}>
//         <textarea
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Введите сообщение..."
//           disabled={sending}
//           rows={3}
//         />
//         <button type="submit" disabled={sending || !newMessage.trim()}>
//           {sending ? 'Отправка...' : 'Отправить'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default TicketChat;