import express, { Request, Response } from "express";
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
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";


// // Middleware для проверки аутентификации
// const authenticateToken = (req: Request, res: Response, next: Function) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) {
//         return res.status(401).json({ error: "Access token required" });
//     }

//     jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
//         if (err) {
//             return res.status(403).json({ error: "Invalid token" });
//         }
//         (req as any).user = user;
//         next();
//     });
// };


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

        res.cookie('token', token, {
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
            console.log(email, password);
            if (!email || !password || !username)
                throw new Error("Email or password error");

            const newUser =createUser({email, password, username})

            if (!newUser) throw new Error("server error on user create")
            return res.status(200).json({ text: newUser });
        } catch (e) {
            return res.status(400).json({ error: e });
        }
    },
);

// router.post("/me")

export default router