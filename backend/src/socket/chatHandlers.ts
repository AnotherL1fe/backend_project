// backend/src/socket/chatHandlers.ts
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { ChatJoinAck, ChatMessage, JoinChatData, SendMessageData } from './chatTypes';
import { JWT_SECRET } from '../middlewares/index';
import { authenticateWebSocket } from '../middlewares/websocketAuth';

const prisma = new PrismaClient();

// Расширенный интерфейс Socket с пользователем
interface AuthSocket extends Socket {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  currentRoom?: string;
  currentTicketId?: number;
}

// Middleware для проверки доступа к тикету
const checkTicketAccess = async (
  socket: AuthSocket,
  ticketId: number
): Promise<{ success: boolean; error?: string; ticket?: any }> => {
  try {
    if (!socket.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        subject: true,
        status: true,
        authorId: true
      }
    });

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    const isAuthor = ticket.authorId === socket.user.id;
    const isAdmin = socket.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Access denied to this ticket' };
    }

    if (ticket.status === 'CLOSED') {
      return { success: false, error: 'Ticket is closed' };
    }

    return { success: true, ticket };
  } catch (error) {
    console.error('Ticket access check error:', error);
    return { success: false, error: 'Failed to check ticket access' };
  }
};

export const registerChatHandlers = (io: Server) => {
  io.use(authenticateWebSocket);

  io.on('connect', (socket: AuthSocket) => {
    const username = socket.user?.username || 'Пользователь';
    console.log(`User connected: ${username} (${socket.id})`);

    socket.on('chat:join', async (data: JoinChatData, callback: (ack: ChatJoinAck) => void) => {
      const { room, nickname, userId } = data;
        console.log(data);
        
      if (!room || !nickname) {
        callback({ ok: false, error: 'Не указана комната или никнейм' });
        return;
      }
      
      // Получаем ticketId из комнаты
      const ticketId = room.startsWith('ticket_') ? parseInt(room.split('_')[1]) : null;
      
      if (!ticketId || isNaN(ticketId)) {
        callback({ ok: false, error: 'Invalid ticket ID' });
        return;
      }

      // Проверяем доступ к тикету
      const access = await checkTicketAccess(socket, ticketId);
      if (!access.success) {
        callback({ ok: false, error: access.error || 'Access denied' });
        return;
      }

      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }
      
      socket.currentRoom = room;
      socket.currentTicketId = ticketId;
      socket.join(room);
      
      console.log(`${nickname} joined room: ${room}`);

      // Загрузка истории сообщений
      const messages = await prisma.message.findMany({
        where: { ticketId },
        include: {
          author: {
            select: { username: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      const history = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        author: msg.author.username,
        authorId: msg.authorId,
        createdAt: msg.createdAt,
        kind: 'message' as const
      }));
      
      socket.emit('chat:history', history);
      
      // Уведомляем других в комнате
      socket.to(room).emit('chat:message', {
        id: Date.now(),
        text: `${nickname} присоединился к чату`,
        author: 'System',
        authorId: 0,
        createdAt: new Date(),
        kind: 'system'
      });
      
      callback({ ok: true });
    });

    // Отправка сообщения
    socket.on('chat:message', async (data: SendMessageData, callback: (ack: ChatJoinAck) => void) => {
      const { text, room, userId } = data;
      
      if (!text || !room) {
        callback({ ok: false, error: 'Неверные данные' });
        return;
      }
      
      // Проверяем, что пользователь в правильной комнате
      if (socket.currentRoom !== room) {
        callback({ ok: false, error: 'Not in the correct room' });
        return;
      }

      // Проверяем, что userId совпадает с авторизованным пользователем
      if (socket.user?.id !== userId) {
        callback({ ok: false, error: 'User ID mismatch' });
        return;
      }
      
      const ticketId = socket.currentTicketId;
      
      if (!ticketId) {
        callback({ ok: false, error: 'No active ticket' });
        return;
      }

      // Проверяем доступ перед отправкой
      const access = await checkTicketAccess(socket, ticketId);
      if (!access.success) {
        callback({ ok: false, error: access.error || 'Access denied' });
        return;
      }
      
      // Сохраняем сообщение в БД
      const savedMessage = await prisma.message.create({
        data: {
          content: text,
          ticketId,
          authorId: userId
        },
        include: {
          author: {
            select: { username: true }
          }
        }
      });
      
      // Отправляем сообщение всем в комнате
      io.to(room).emit('chat:message', {
        id: savedMessage.id,
        text: savedMessage.content,
        author: savedMessage.author.username,
        authorId: savedMessage.authorId,
        createdAt: savedMessage.createdAt,  
        kind: 'message' as const
      });
      
      callback({ ok: true });
    });

    // Печатает
    socket.on('chat:typing', (data: { room: string; isTyping: boolean }) => {
      if (socket.currentRoom === data.room && socket.user?.username) {
        socket.to(data.room).emit('chat:typing', {
          user: socket.user.username,
          isTyping: data.isTyping
        });
      }
    });

    // Закрытие тикета
    socket.on('chat:close_ticket', async (data: { room: string }, callback: (ack: ChatJoinAck) => void) => {
      const { room } = data;
      const ticketId = socket.currentTicketId;
      
      if (!ticketId) {
        callback({ ok: false, error: 'No active ticket' });
        return;
      }

      const isAdmin = socket.user?.role === 'ADMIN';
      const isAuthor = socket.currentTicketId ? true : false;

      if (!isAdmin && !isAuthor) {
        callback({ ok: false, error: 'Only admin or author can close ticket' });
        return;
      }

      try {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'CLOSED',
            closedAt: new Date()
          }
        });

        const username = socket.user?.username || 'Система';
        
        io.to(room).emit('chat:message', {
          id: Date.now(),
          text: `Тикет закрыт ${username}`,
          author: 'System',
          authorId: 0,
          createdAt: new Date(),
          kind: 'system'
        });

        callback({ ok: true });
      } catch (error) {
        console.error('Error closing ticket:', error);
        callback({ ok: false, error: 'Failed to close ticket' });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        const username = socket.user?.username || 'Пользователь';
        io.to(socket.currentRoom).emit('chat:message', {
          id: Date.now(),
          text: `${username} покинул чат`,
          author: 'System',
          authorId: 0,
          createdAt: new Date(),
          kind: 'system'
        });
      }
      console.log(`User disconnected: ${socket.user?.username || 'Unknown'} (${socket.id})`);
    });
  });
};