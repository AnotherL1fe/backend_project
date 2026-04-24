import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserCode } from "../types/user";
import prisma from "../db";
import { User } from "@prisma/client";
import { log } from "node:console";
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
    user?: User;
}

export const authenticateToken = (req: Request, res: Response, next: Function) => {
    const cookieToken = req.cookies?.ref_token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];

    const token = cookieToken || headerToken;
console.log(token);

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, async (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => {

        if (err || !decoded || typeof decoded == "string") {
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        const requairedUser = await prisma.user.findFirst({
            where: { id: decoded.userId},
        });
        if (!requairedUser) return  res.status(403).json({ error: "Invalid or expired token" });      
// преобразовать requairedUser и убрать пароль
        // const { password, ...userWithoutPassword = requairedUser;

        (req as Request & {user: User}).user = requairedUser ;
        next();
    });

};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: Function
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    return;
  }
  next();
};

export default authenticateToken;
