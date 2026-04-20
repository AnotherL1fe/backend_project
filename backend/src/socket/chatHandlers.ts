import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { JoinChatData } from './chatTypes';
import { SendMessageData } from './chatTypes';

const prisma = new PrismaClient();

export const registerChatHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);
    
    let currentRoom: string | null = null;

    // Подключение к комнате тикета
    socket.on('join_chat', async (data: JoinChatData) => {
      const { room, nickname, userId } = data;
      
      if (!room || !nickname) {
        socket.emit('error', 'Не указана комната или никнейм');
        return;
      }
      
      if (currentRoom) {
        socket.leave(currentRoom);
      }
      
      currentRoom = room;
      socket.join(room);
      
      console.log(`${nickname} joined room: ${room}`);
      
      // Загрузка истории сообщений
      const ticketId = room.startsWith('ticket_') ? parseInt(room.split('_')[1]) : null;
      
      if (ticketId && !isNaN(ticketId)) {
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
          kind: 'message'
        }));
        
        socket.emit('chat_history', history);
      }
      
      socket.to(room).emit('system_message', {
        text: `${nickname} присоединился к чату`,
        timestamp: new Date()
      });
      
      socket.emit('connected', { room, nickname });
      console.log("WEBSOCKET CONCTED ");
      
    });

    // Отправка сообщения
    socket.on('send_message', async (data: SendMessageData) => {
      const { text, room, nickname, userId } = data;
      
      if (!text || !room || !nickname) {
        socket.emit('error', 'Неверные данные');
        return;
      }
      
      const ticketId = room.startsWith('ticket_') ? parseInt(room.split('_')[1]) : null;
      
      let savedMessage = null;
      
      if (ticketId && !isNaN(ticketId)) {
        savedMessage = await prisma.message.create({
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
      }
      
      io.to(room).emit('new_message', {
        id: savedMessage?.id || Date.now(),
        text: text,
        author: nickname,
        authorId: userId,
        createdAt: new Date(),
        kind: 'message'
      });
    });

    // Печатает
    socket.on('typing', (data: { room: string; nickname: string; isTyping: boolean }) => {
      if (currentRoom === data.room) {
        socket.to(data.room).emit('user_typing', {
          nickname: data.nickname,
          isTyping: data.isTyping
        });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      if (currentRoom) {
        io.to(currentRoom).emit('system_message', {
          text: `Пользователь покинул чат`,
          timestamp: new Date()
        });
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};