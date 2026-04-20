import prisma from "../db";
import { TicketStatus, Priority } from "@prisma/client";

export interface TicketCreateData {
  subject: string;
  description?: string;
  priority?: Priority;
  authorId: number;
}

export interface TicketUpdateData {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: Priority;
}

class TicketService {
  // Получить тикеты пользователя
  async getUserTickets(userId: number) {
    return await prisma.ticket.findMany({
      where: { authorId: userId },
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
  }

  // Получить все тикеты (админ)
  async getAllTickets() {
    return await prisma.ticket.findMany({
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
  }

  // Получить тикет по ID
  async getTicketById(id: number) {
    return await prisma.ticket.findUnique({
      where: { id },
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
  }

  // Создать тикет
  async createTicket(data: TicketCreateData) {
    return await prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        authorId: data.authorId
      },
      include: {
        author: {
          select: { id: true, username: true }
        }
      }
    });
  }

  // Обновить статус тикета
  async updateTicketStatus(id: number, status: TicketStatus) {
    return await prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null
      }
    });
  }

  // Обновить тикет
  async updateTicket(id: number, data: TicketUpdateData) {
    return await prisma.ticket.update({
      where: { id },
      data
    });
  }

  // Удалить тикет
  async deleteTicket(id: number) {
    await prisma.ticket.delete({
      where: { id }
    });
    return true;
  }
}

export default new TicketService();