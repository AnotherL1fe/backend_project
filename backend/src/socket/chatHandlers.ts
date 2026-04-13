// backend/src/chat/chatHandlers.ts
import { Server, Socket } from 'socket.io';
import { DEFAULT_ROOM } from './chatTypes';
import type {
  ChatJoinAck,
  ChatJoinPayload,
  ChatSendAck,
  ChatSendPayload,
  SocketChatData,
} from './chatTypes';
import { addSystemMessage, addUserMessage, getRoomHistory } from './chatService';

function isValidRoom(room: string): boolean {
  return room.trim().length >= 1 && room.trim().length <= 40;
}

function isValidNickname(nickname: string): boolean {
  return nickname.trim().length >= 1 && nickname.trim().length <= 30;
}

export function registerChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('🟢 Chat client connected:', socket.id);
    
    const socketData = socket.data as SocketChatData;
    if (!socketData.room) socketData.room = DEFAULT_ROOM;

    socket.on(
      'chat:join',
      (payload: ChatJoinPayload, callback: (ack: ChatJoinAck) => void) => {
        try {
          const room = payload?.room?.toString?.() ?? '';
          const nickname = payload?.nickname?.toString?.() ?? '';

          console.log(`📝 User ${nickname} joining room ${room}`);

          if (!isValidRoom(room)) {
            callback({ ok: false, error: 'Некорректное имя комнаты' });
            return;
          }
          if (!isValidNickname(nickname)) {
            callback({ ok: false, error: 'Некорректное имя' });
            return;
          }

          // Если пользователь переподключается/меняет комнату
          if (socketData.room && socketData.room !== room) {
            socket.leave(socketData.room);
          }

          socketData.room = room;
          socketData.nickname = nickname;

          socket.join(room);

          // Отправляем историю сообщений
          const history = getRoomHistory(room);
          socket.emit('chat:history', history);

          // Уведомляем всех о новом пользователе
          const systemMessage = addSystemMessage({
            room,
            text: `${nickname} присоединился(лась)`,
          });
          io.to(room).emit('chat:message', systemMessage);

          callback({ ok: true });
        } catch (e) {
          console.error('Join error:', e);
          callback({
            ok: false,
            error: e instanceof Error ? e.message : 'Ошибка обработки join',
          });
        }
      },
    );

    socket.on(
      'chat:message',
      (payload: ChatSendPayload, callback: (ack: ChatSendAck) => void) => {
        try {
          const room = payload?.room?.toString?.() ?? '';
          const text = payload?.text?.toString?.() ?? '';

          if (!socketData.room || socketData.room !== room) {
            callback({ ok: false, error: 'Нет доступа к этой комнате' });
            return;
          }
          if (!socketData.nickname) {
            callback({ ok: false, error: 'Сначала выполните join' });
            return;
          }

          const message = addUserMessage({
            room,
            nickname: socketData.nickname,
            text,
          });

          io.to(room).emit('chat:message', message);
          callback({ ok: true });
        } catch (e) {
          console.error('Message error:', e);
          callback({
            ok: false,
            error: e instanceof Error ? e.message : 'Ошибка отправки сообщения',
          });
        }
      },
    );

    socket.on('disconnect', () => {
      console.log('🔴 Chat client disconnected:', socket.id);
      
      const room = socketData.room;
      const nickname = socketData.nickname;
      if (!room || !nickname) return;

      const systemMessage = addSystemMessage({
        room,
        text: `${nickname} вышел(ла)`,
      });
      io.to(room).emit('chat:message', systemMessage);
    });
  });
}