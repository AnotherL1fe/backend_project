import cors from "cors";
import express, { Request, Response } from "express";
import routerAuth from "./api/auth"
import routerPosts from "./api/posts"
import cookieParser from "cookie-parser";
import routerUsers from "./api/users"

const app = express();

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

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
