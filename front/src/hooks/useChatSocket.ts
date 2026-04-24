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

  const [status, setStatus] = useState<ChatConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    const socket = socketRef.current
    socketRef.current = null
    activeRoomRef.current = null

    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    setStatus('disconnected')
  }, [])

  const connect = useCallback((payload: ChatJoinPayload) => {
    if (socketRef.current && activeRoomRef.current === payload.room && status === 'connected') {
      console.log('Already connected to this room');
      return;
    }

    // Отключаем существующее соединение
    if (socketRef.current) {
      disconnect();
    }

    setError(null);
    setStatus('connecting');

    const socket = io(backendUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });

    socketRef.current = socket;
    activeRoomRef.current = payload.room;

      socket.on('connect', () => {
        const onJoinAck = (ack: ChatJoinAck) => {
          console.log(ack);
          
          if (ack.ok) {
            setStatus('connected')
          } else {
            setStatus('error')
            setError(ack.error)
          }
        }

        socket.emit('chat:join', payload, onJoinAck)
      })

      socket.on('connect:error', (e) => {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Ошибка подключения')
      })

      socket.on('disconnect', () => {
        setStatus('disconnected')
      })

      socket.on('chat:history', (history: ChatMessage[]) => {
        console.log(history);
        
        setMessages(history)
      })

      socket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
      })

      socket.connect()
    },
    [backendUrl, disconnect],
  )

  const sendMessage = useCallback(
    (text: string) => {
      const socket = socketRef.current
      const room = activeRoomRef.current
      if (!socket || !room) return

      socket.emit(
        'chat:message',
        { room, text },
        (ack: ChatSendAck) => {
          console.log(ack);
          
          if (!ack.ok) {
            setStatus('error')
            setError(ack.error)
          }
        },
      )
    },
    [setStatus],
  )

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
  
  return {
    status,
    error,
    messages,
    connect,
    disconnect,
    sendMessage,
    isSystemMessage,
  }
}
