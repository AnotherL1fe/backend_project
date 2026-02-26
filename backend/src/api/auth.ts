import express, { Request, Response } from "express";
import request from "express";
import { hashPass } from "../utils/hashPass";
import { comparePass } from "../utils/comparePass"
import prisma from "../db";
import bcrypt from "bcrypt";
import { error } from "node:console";
import jwt from "jsonwebtoken";
import { createUser } from "../services/auth";
import authenticateToken from "../middlewares/index"

interface RegisterBody {
    username: string;
    email: string;
    password: string;
}

interface LoginBody {
    email: string;
    password: string;
}

const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
    try {
        console.log("login");
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        
        // Генерируем JWT токен
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                username: user.username 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.cookie('ref_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            message: "Login successful",
            user: userWithoutPassword,
            token: token
        });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post(
    "/logout",
    authenticateToken,
    async function (req: Request, res: Response) {
        
        try {
            console.log("logout");
            res.clearCookie('ref_token');

            return res.status(200).json({
                message: 'Logout successful'
            })
        } catch (e) {
            console.error("Logout Error:", e);
            return res.status(500).json({ error: "Interial server error" })
        }
    }
);

router.post(
    "/register",
    async function (req: Request<{}, {}, RegisterBody>, res: Response) {
        try {
            const { username, email, password } = req.body;
            console.log(email, password);
            if (!email || !password || !username)
                throw new Error("Email or password error");

            const newUser = await createUser({email, password, username})

            if (!newUser) throw new Error("server error on user create")
            return res.status(200).json({ text: newUser });
        } catch (e) {
            return res.status(400).json({ error: e });
        }
    },
);

import type { User } from "@prisma/client";
import type { UserCode } from "../types/user";
router.get(
    "/me",
    authenticateToken,
    async function (req: Request & {user?: UserCode} , res: Response) {
        // Изменить usercode на тип данных user но без пароля
        try {
            if (!req.user) return
            const userId = req.user.userId;
            
            if (!userId) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const user = await prisma.user.findUnique({
                where: { id: +userId },
                include: {
                    posts: {
                        select: {
                            id: true,
                            title: true,
                            createdAt: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const { password: _, ...userWithoutPassword } = user;
            
            res.json({
                user: userWithoutPassword
            });
            
        } catch (e) {
            console.error("/me error:", e);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
);

export default router