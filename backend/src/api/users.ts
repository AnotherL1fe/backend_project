import express, { Request, Response } from "express";
import prisma from "../db";
import authenticateToken from "../middlewares/index";
import { SafeUserDto } from "../dto/userResponce";

const router = express.Router();

// GET /api/users - получить всех пользователей
router.get("/", async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                posts: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Преобразуем в SafeUserDto (без пароля)
        const safeUsers = users.map(user => new SafeUserDto(user));
        
        res.json({ users: safeUsers });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/users/:id - получить пользователя по ID
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                posts: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const safeUser = new SafeUserDto(user);
        res.json({ user: safeUser });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;