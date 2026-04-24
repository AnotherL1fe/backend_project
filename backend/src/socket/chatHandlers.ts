import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ChatJoinAck, ChatMessage, JoinChatData } from './chatTypes';
import { SendMessageData } from './chatTypes';

const prisma = new PrismaClient();

export const registerChatHandlers = (io: Server) => {
  io.on('connect', (socket: Socket) => {
    // console.log(`User connected: ${socket.id}`);
    
    let currentRoom: string | null = null;

    // Подключение к комнате тикета
    socket.on('chat:join', async (data: JoinChatData, callback: (ack: ChatJoinAck)=> void) => {
      const { room, nickname, userId } = data;
      
      if (!room || !nickname) {
        callback({ok: false, error: 'Не указана комната или никнейм'})
        // socket.emit('connect:error', );
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
        
        socket.emit('chat:history', history);
      }
      
      socket.to(room).emit('system:message', {
        text: `${nickname} присоединился к чату`,
        timestamp: new Date()
      });
      
      callback({ok: true})
      // socket.emit('connect', { room, nickname });
      // console.log("WEBSOCKET CONCTED ");
      
    });

    // Отправка сообщения
    socket.on('chat:message', async (data: SendMessageData, callback: (ack: ChatJoinAck)=> void) => {
      const { text, room, nickname, userId } = data;
        console.log(text);
        
      if (!text || !room || !nickname) {
        callback({ok: false, error: 'Неверные данные'})
        // socket.emit('error', 'Неверные данные');
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
      
      io.to(room).emit('chat:message', {
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
        io.to(currentRoom).emit('system:message', {
          text: `Пользователь покинул чат`,
          timestamp: new Date()
        });
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};