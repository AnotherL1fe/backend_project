// src/api/tickets.ts
import express, { Request, Response } from "express";
import ticketService from "../services/ticketService";
import authenticateToken from "../middlewares/index"

const router = express.Router();

// GET /api/tickets/my - получить тикеты текущего пользователя
router.get("/my", authenticateToken, async (req: any, res: Response) => {
  try {
    const tickets = await ticketService.getUserTickets(req.user.id);
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({ error: "Ошибка загрузки тикетов" });
  }
});

// GET /api/tickets/all - получить все тикеты (только админ)
router.get("/all", authenticateToken, async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const tickets = await ticketService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ error: "Ошибка загрузки тикетов" });
  }
});

// GET /api/tickets/:id - получить тикет по ID
router.get("/:id", authenticateToken, async (req: any, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID тикета" });
    }
    
    const ticket = await ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: "Тикет не найден" });
    }
    
    // Проверка прав
    if (ticket.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ error: "Ошибка загрузки тикета" });
  }
});

// POST /api/tickets - создать тикет
router.post("/", authenticateToken, async (req: any, res: Response) => {
  try {
    const { subject, priority, description } = req.body;
    
    if (!subject || subject.trim().length === 0) {
      return res.status(400).json({ error: "Тема обращения обязательна" });
    }
    
    const ticket = await ticketService.createTicket({
      subject: subject.trim(),
      description,
      priority: priority?.toUpperCase(),
      authorId: req.user.id
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
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Ошибка создания тикета" });
  }
});

// PATCH /api/tickets/:id/status - обновить статус тикета
router.patch("/:id/status", authenticateToken, async (req: any, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: "Неверный статус" });
    }
    
    const ticket = await ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: "Тикет не найден" });
    }
    
    if (ticket.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const updatedTicket = await ticketService.updateTicketStatus(ticketId, status);
    
    // Уведомление в чат
    const io = req.app.get('io');
    const roomName = `ticket_${ticketId}`;
    io?.to(roomName).emit('ticket_status_changed', {
      status,
      message: status === 'CLOSED' ? 'Тикет закрыт' : 'Тикет открыт'
    });
    
    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({ error: "Ошибка обновления статуса" });
  }
});

export default router;