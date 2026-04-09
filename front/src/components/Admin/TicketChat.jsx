import React, { useState, useEffect, useRef } from 'react';
import './TicketChat.css';
import { Link } from 'react-router-dom';

const TicketChat = ({ ticket, onBack, onSendMessage }) => {
  console.log(ticket);
  
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    // Здесь будет API вызов
    const messageData = {
      id: Date.now(),
      content: newMessage,
      authorId: 2,
      author: { username: 'admin' },
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, messageData]);
    if (onSendMessage) onSendMessage(ticket.id, newMessage);
    setNewMessage('');
    setSending(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ticket-chat">
      <div className="chat-header">
            <Link to="/admin" className="admin-back-link">← Вернуться к панели Администратора</Link>
        {/* <div className="chat-title">
          <h2>{ticket.title}</h2>
          <div className="chat-meta">
            <span>👤 {ticket.user?.username}</span>
            <span>📧 {ticket.user?.email}</span>
          </div>
        </div> */}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">Нет сообщений. Начните диалог с пользователем.</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.authorId === ticket.UserId ? 'user' : 'admin'}`}>
              <div className="message-header">
                <strong>{msg.author?.username}</strong>
                <span className="message-time">{formatTime(msg.createdAt)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          disabled={sending}
          rows={3}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};

export default TicketChat;