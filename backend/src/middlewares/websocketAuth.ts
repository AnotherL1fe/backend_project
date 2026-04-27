import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET } from './index';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();

export interface AuthSocket extends Socket {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  ticket?: {
    id: number;
    subject: string;
    status: string;
    authorId: number;
  };
}
const parseCookiesWithParser = (cookieHeader: string | undefined): any => {
  if (!cookieHeader) return {};
  
  // Создаем заглушку req для cookie-parser
  const req: any = {
    headers: {
      cookie: cookieHeader
    }
  };
  
  const res: any = {};
  
  // Используем cookie-parser middleware
  cookieParser()(req, res, () => {});
  
  return req.cookies || {};
};

// Middleware для аутентификации WebSocket
export const authenticateWebSocket = async (
  socket: AuthSocket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    // Получаем токен из handshake query или headers
    const token = parseCookiesWithParser(socket.handshake.headers.cookie)?.ref_token;
    
        // socket.handshake.auth.token || 
    //               socket.handshake.headers.authorization?.split(' ')[1] ||
    //               socket.handshake.query.token ||
    console.log(token);
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Верифицируем токен
    const decoded = jwt.verify(token as string, JWT_SECRET) as any;
    
    if (!decoded || typeof decoded === 'string') {
      return next(new Error('Invalid token'));
    }

    // Находим пользователя в БД
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Сохраняем пользователя в socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Middleware для проверки доступа к тикету
export const checkTicketAccess = async (
  socket: AuthSocket,
  ticketId: number,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    if (!socket.user) {
      return next(new Error('User not authenticated'));
    }

    // Находим тикет
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!ticket) {
      return next(new Error('Ticket not found'));
    }

    // Проверяем права доступа
    const isAuthor = ticket.authorId === socket.user.id;
    const isAdmin = socket.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return next(new Error('Access denied to this ticket'));
    }

    // Сохраняем тикет в socket
    socket.ticket = ticket;
    next();
  } catch (error) {
    console.error('Ticket access check error:', error);
    next(new Error('Failed to check ticket access'));
  }
};

// Middleware для проверки роли администратора
export const requireAdminForSocket = (
  socket: AuthSocket,
  next: (err?: Error) => void
): void => {
  if (!socket.user) {
    return next(new Error('User not authenticated'));
  }

  if (socket.user.role !== 'ADMIN') {
    return next(new Error('Admin access required'));
  }

  next();
};

// Middleware для проверки что чат не закрыт
export const checkTicketNotClosed = async (
  socket: AuthSocket,
  ticketId: number,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true }
    });

    if (!ticket) {
      return next(new Error('Ticket not found'));
    }

    if (ticket.status === 'CLOSED') {
      return next(new Error('Ticket is closed. Cannot send messages'));
    }

    next();
  } catch (error) {
    console.error('Ticket status check error:', error);
    next(new Error('Failed to check ticket status'));
  }
};