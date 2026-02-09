import express, { Request, Response } from "express";
import { hashPass } from "../utils/hashPass";
import { comparePass } from "../utils/comparePass"
import prisma from "../db";
import { error } from "node:console";
import jwt from "jsonwebtoken";

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
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";


// // Middleware для проверки аутентификации
const authenticateToken = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        (req as any).user = user;
        next();
    });
};


router.post(
    "/login",
    async function (req: Request<{}, {}, LoginBody>, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                throw new Error("Email or password error1");
            const user = await prisma.user.findUniqe({
                where: { email }
            });
            if (!user) {
                return res.status(400).json({ error: "Email or password error" });
            }
            const isPasswordValid = await comparePass(password, user.password)
            if (!isPasswordValid) {
                return res.status(400).json({ error: "Email or password error" });
            }





            //JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    username: user.username
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            });

            const { password: _, ...userWithoutPassword } = user;

            return res.status(200).json({
                message: "Login successful",
                user: userWithoutPassword,
                token
            });






        } catch (e) {
            console.error("Login error:", e);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);
router.post(
    "/logout",
    authenticateToken,
    async function (req: Request<{}, {}, LoginBody>, res: Response) {
        try {
            res.clearCookie('token');

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
            if (!email || !password || !username)
                throw new Error("Email or password error");
            console.log(email, password);
            if (email) {
            }
            const hashedPass = await hashPass(password);
            const newUser = prisma.user.create({
                data: { username, email, password: hashedPass },
            });
            return res.status(200).json({ text: newUser });
        } catch (e) {
            return res.status(400).json({ error: e });
        }
    },
);