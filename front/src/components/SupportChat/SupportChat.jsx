import React, { useState, useEffect, useRef } from 'react';
import './SupportChat.css';

const SupportChat = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Здравствуйте! Чем я могу вам помочь?",
      sender: "support",
      timestamp: new Date(),
      read: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

// Автоскролл
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Добавляем сообщение пользователя
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
      read: true
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Имитация ответа поддержки (заменить на реальный API)
    setTimeout(() => {
      const supportMessage = {
        id: Date.now() + 1,
        text: getAutoReply(inputMessage),
        sender: "support",
        timestamp: new Date(),
        read: false
      };
      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Автоответчик (заменить на API)
  const getAutoReply = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("привет") || lowerMsg.includes("здравствуйте")) {
      return "Здравствуйте, Я автоответчик! Рады вас видеть в нашем сервисе. Чем можем помочь?";
    }
    if (lowerMsg.includes("помощь") || lowerMsg.includes("помогите")) {
      return "Конечно, я помогу вам! Опишите вашу проблему подробнее.";
    }
    if (lowerMsg.includes("спасибо")) {
      return "Пожалуйста! Обращайтесь, если понадобится помощь.";
    }
    if (lowerMsg.includes("проблем") || lowerMsg.includes("ошибк") || lowerMsg.includes("баг")) {
      return "Извините за доставленные неудобства. Наши разработчики уже работают над этой проблемой.";
    }
    return "Спасибо за ваше сообщение. Наш специалист скоро ответит вам.";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="support-chat-window">
      <div className="support-chat-header">
        <div className="support-chat-header-info">
          <div className="support-chat-avatar">💬</div>
          <div>
            <h3>Служба поддержки</h3>
            <p className="support-chat-status">Онлайн • Отвечаем сразу</p>
          </div>
        </div>
      </div>

      <div className="support-chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`support-chat-message ${message.sender}`}>
            <div className="support-message-bubble">
              <p>{message.text}</p>
              <span className="support-message-time">
                {formatTime(message.timestamp)}
                {message.sender === 'user' && (
                  <span className="support-message-status">
                    {message.read ? '✓✓' : '✓'}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="support-chat-message support">
            <div className="support-message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="support-chat-input-area">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Напишите ваше сообщение..."
          rows="1"
        />
        <button 
          onClick={sendMessage} 
          disabled={!inputMessage.trim()}
          className="support-send-button"
        >
          ➤
        </button>
      </div>
      
      <div className="support-chat-footer">
        <span>⏱ Обычно отвечаем за 1-2 минуты</span>
      </div>
    </div>
  );
};

export default SupportChat;