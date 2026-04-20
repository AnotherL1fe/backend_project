import express, { Request, Response } from "express";
import userService from "../services/userService";
import authenticateToken from "../middlewares/index";

const router = express.Router();

// GET /api/users - получить всех пользователей
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id - получить пользователя по ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string );
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users - создать пользователя
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Проверка на существующего пользователя
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const existingUsername = await userService.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const user = await userService.createUser({ email, username, password });
    res.status(201).json({ user });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id - обновить пользователя
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await userService.updateUser(id, req.body);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id - удалить пользователя
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await userService.deleteUser(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;