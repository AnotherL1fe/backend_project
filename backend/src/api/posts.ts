import express, { Request, Response } from "express";
import prisma from "../db";
import authenticateToken from "../middlewares/index";
import type { AuthRequest } from "../middlewares/index";

const router = express.Router();

// Интерфейсы для запросов
interface CreatePostBody {
  title: string;
  content?: string;
}

interface UpdatePostBody {
  title?: string;
  content?: string;
}

// GET /api/posts - получить все посты
router.get("/", async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/posts/:id - получить пост по ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts - создать новый пост (только для авторизованных)
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body as CreatePostBody;
    const authorId = req.user?.id;
    
    if (!authorId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    const post = await prisma.post.create({
      data: {
        title,
        content: content || "",
        authorId
      },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({ 
      message: "Post created successfully",
      success: true,
      post 
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/posts/:id - обновить пост (только автор)
router.put("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    
    const { title, content } = req.body as UpdatePostBody;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Проверяем, существует ли пост и принадлежит ли он пользователю
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }
    
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: title || existingPost.title,
        content: content !== undefined ? content : existingPost.content
      },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    
    res.json({ 
      message: "Post updated successfully",
      post: updatedPost 
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/posts/:id - удалить пост (только автор или админ)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Проверяем, существует ли пост и принадлежит ли он пользователю
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }
    
    await prisma.post.delete({
      where: { id }
    });
    
    res.json({ 
      message: "Post deleted successfully" 
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/posts/user/:userId - получить посты пользователя
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ posts });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;