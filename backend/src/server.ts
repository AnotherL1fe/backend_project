import cors from "cors";
import express, { Request, Response } from "express";
import useAuthRouter from "./routes/auth"


const app = express();

app.use(express.json());
app.use(cors({
    origin: "*",
    credentials: true
}))

app.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", useAuthRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
