// src/api/tickets.ts
import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middlewares/index';

const router = express.Router();
const prisma = new PrismaClient();

// Получить тикеты текущего пользователя
router.get('/my', authenticateToken, async (req: any, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { authorId: req.user.id },
      include: {
        _count: {
          select: { messages: true }
        },
        author: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Ошибка загрузки тикетов' });
  }
});

// Получить все тикеты (админ)
router.get('/all', authenticateToken, async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const tickets = await prisma.ticket.findMany({
      include: {
        author: {
          select: { username: true, email: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ error: 'Ошибка загрузки тикетов' });
  }
});

// Получить тикет по ID
router.get('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        author: {
          select: { id: true, username: true, email: true }
        },
        messages: {
          include: {
            author: {
              select: { id: true, username: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Тикет не найден' });
    }
    
    // Проверка прав
    if (ticket.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Ошибка загрузки тикета' });
  }
});

// Создать тикет
router.post('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { subject, priority, description } = req.body;
    
    if (!subject || subject.trim().length === 0) {
      return res.status(400).json({ error: 'Тема обращения обязательна' });
    }
    
    const ticket = await prisma.ticket.create({
      data: {
        subject: subject.trim(),
        description: description || null,
        priority: priority?.toUpperCase() || 'MEDIUM',
        authorId: req.user.id
      },
      include: {
        author: {
          select: { id: true, username: true }
        }
      }
    });
    
    // Уведомление админов через Socket.IO
    const io = req.app.get('io');
    io?.to('support_admin').emit('new_ticket', {
      id: ticket.id,
      subject: ticket.subject,
      author: req.user.username
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Ошибка создания тикета' });
  }
});

// Обновить статус тикета
router.patch('/:id/status', authenticateToken, async (req: any, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Тикет не найден' });
    }
    
    if (ticket.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null
      }
    });
    
    // Уведомление в чат
    const io = req.app.get('io');
    const roomName = `ticket_${ticketId}`;
    io?.to(roomName).emit('ticket_status_changed', {
      status,
      message: status === 'CLOSED' ? 'Тикет закрыт' : 'Тикет открыт'
    });
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

export default router;