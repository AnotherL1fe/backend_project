// front/src/hooks/useChatSocket.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  ChatJoinAck,
  ChatMessage,
  ChatJoinPayload,
  ChatSendAck,
} from '../components/SupportChat/chatTypes'
import type { ChatRoomName } from '../components/SupportChat/chatTypes'

type ChatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

function isSystemMessage(message: ChatMessage): message is ChatMessage & { kind: 'system' } {
  return message.kind === 'system'
}

export function useChatSocket(backendUrl: string) {
  const socketRef = useRef<Socket | null>(null)
  const activeRoomRef = useRef<ChatRoomName | null>(null)
  const isConnectingRef = useRef(false)

  const [status, setStatus] = useState<ChatConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    const socket = socketRef.current
    socketRef.current = null
    activeRoomRef.current = null
    isConnectingRef.current = false

    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    setStatus('disconnected')
    setError(null)
  }, [])

  const connect = useCallback((payload: ChatJoinPayload) => {
    // Предотвращаем повторные подключения
    if (isConnectingRef.current) {
      console.log('Already connecting, skipping...')
      return
    }

    if (socketRef.current && activeRoomRef.current === payload.room && status === 'connected') {
      console.log('Already connected to this room')
      return
    }

    // Отключаем существующее соединение
    if (socketRef.current) {
      disconnect()
    }

    // Получаем токен из разных источников
    
    
    setError(null)
    setStatus('connecting')
    isConnectingRef.current = true

    const socket = io(backendUrl, {
      autoConnect: true,
      transports: ['websocket'],
      withCredentials: true,
      reconnection: false
    })

    socketRef.current = socket
    activeRoomRef.current = payload.room

    socket.on('connect', () => {
      console.log('Socket connected, joining room...')
      
      socket.emit('chat:join', payload, (ack: ChatJoinAck) => {
        console.log('Join response:', ack)

        if (ack.ok) {
          setStatus('connected')
          isConnectingRef.current = false
        } else {
          setStatus('error')
          setError(ack.error || 'Failed to join chat')
          isConnectingRef.current = false
        }
      })
    })

    socket.on('connect_error', (e) => {
      console.error('Connection error:', e.message)
      setStatus('error')
      setError(e.message || 'Ошибка подключения')
      isConnectingRef.current = false
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setStatus('disconnected')
      isConnectingRef.current = false
    })

    socket.on('chat:history', (history: ChatMessage[]) => {
      console.log('Received history:', history?.length)
      setMessages(history || [])
    })

    socket.on('chat:message', (message: ChatMessage) => {
      console.log('Received message:', message)
      setMessages((prev) => [...prev, message])
    })

  }, [backendUrl, disconnect, status])

// front/src/hooks/useChatSocket.ts

const sendMessage = useCallback(
  (text: string) => {
    const socket = socketRef.current;
    const room = activeRoomRef.current;
    const currentStatus = status; // Сохраняем текущий статус
    
    console.log('📤 sendMessage called:', { 
      text, 
      room, 
      socketExists: !!socket, 
      status: currentStatus 
    });
    
    if (!socket || !room || currentStatus !== 'connected') {
      console.warn('Cannot send message: not connected', { socket: !!socket, room, status: currentStatus });
      setError('Not connected to chat');
      return;
    }

    // Получаем userId из разных источников
    let userId = null;
    try {
      // Пробуем получить из localStorage
      const userStr = localStorage.getItem('user') || localStorage.getItem('auth-user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id;
      }
      
      // Если нет в localStorage, пробуем из кук
      if (!userId) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
          if (cookie.startsWith('user_id=')) {
            userId = parseInt(cookie.split('=')[1]);
            break;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
    
    console.log('👤 User ID for message:', userId);
    
    const messageData = { room, text, userId };
    console.log('📦 Emitting chat:message with data:', messageData);
    
    socket.emit('chat:message', messageData, (ack: ChatSendAck) => {
      console.log('📥 Send acknowledgment received:', ack);
      if (ack && !ack.ok) {
        console.error('❌ Message send failed:', ack.error);
        setStatus('error');
        setError(ack.error);
      } else {
        console.log('✅ Message sent successfully');
      }
    });
  },
  [status, setError, setStatus] // Добавляем зависимости
);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
      isConnectingRef.current = false
    }
  }, [])

  return {
    status,
    error,
    messages,
    connect,
    disconnect,
    sendMessage,
    isSystemMessage,
    isConnected: status === 'connected'
  }
}