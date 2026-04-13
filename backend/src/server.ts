import cors from "cors";
import express, { Request, Response } from "express";
import routerAuth from "./api/auth"
import routerPosts from "./api/posts"
import cookieParser from "cookie-parser";
import routerUsers from "./api/users"
import { Server as SocketServer } from 'socket.io';
import http from "http"
import { registerChatHandlers } from './socket/chatHandlers';

const app = express();
const server = http.createServer(app);
const PORT = 3001;

const io = new SocketServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

registerChatHandlers(io);

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", routerAuth);
app.use("/api/posts", routerPosts)
app.use("/api/users", routerUsers)


server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Socket.IO chat server ready`);
});
