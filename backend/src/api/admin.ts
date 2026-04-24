// backend/src/api/admin.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middlewares/index';

const router = Router();
const prisma = new PrismaClient();

// ==================== USERS ====================

// GET /api/admin/users - получить всех пользователей
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Fetching all users from database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            tickets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${users.length} users`);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Ошибка загрузки пользователей' });
  }
});

// GET /api/admin/users/:id - получить пользователя по ID
router.get('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            posts: true,
            tickets: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Ошибка загрузки пользователя' });
  }
});

// PUT /api/admin/users/:id - обновить пользователя
router.put('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    const { username, email, role } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username: username || existingUser.username,
        email: email || existingUser.email,
        role: role || existingUser.role
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});

// DELETE /api/admin/users/:id - удалить пользователя
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    await prisma.user.delete({ where: { id } });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

// ==================== POSTS ====================

// GET /api/admin/posts - получить все посты
router.get('/posts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Ошибка загрузки постов' });
  }
});

// GET /api/admin/users/:id/posts - получить посты пользователя
router.get('/users/:id/posts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Ошибка загрузки постов пользователя' });
  }
});

// DELETE /api/admin/posts/:id - удалить пост
router.delete('/posts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    await prisma.post.delete({
      where: { id }
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Ошибка удаления поста' });
  }
});

// ==================== TICKETS ====================

// GET /api/admin/tickets - получить все тикеты
router.get('/tickets', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Ошибка загрузки тикетов' });
  }
});

// GET /api/admin/tickets/:id - получить тикет по ID
router.get('/tickets/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        messages: {
          include: {
            author: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Ошибка загрузки тикета' });
  }
});

// PATCH /api/admin/tickets/:id/status - обновить статус тикета
router.patch('/tickets/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(typeof req.params.id == "object" ? req.params.id[0] : req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null
      }
    });
    
    res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса тикета' });
  }
});

// ==================== STATS ====================

// GET /api/admin/stats - получить статистику
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalPosts, totalTickets, activeTickets] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'OPEN' } })
    ]);
    
    res.json({
      totalUsers,
      totalPosts,
      totalTickets,
      activeTickets,
      closedTickets: totalTickets - activeTickets
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Ошибка загрузки статистики' });
  }
});

export default router;