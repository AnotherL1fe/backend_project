import prisma from "../db";
import bcrypt from "bcrypt";
import { SafeUserDto } from "../dto/userResponce";

export interface UserCreateData {
  email: string;
  username: string;
  password: string;
}

export interface UserUpdateData {
  email?: string;
  username?: string;
  password?: string;
}

class UserService {
  // Получить всех пользователей
  async getAllUsers() {
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
        },
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => new SafeUserDto(user));
  }

  // Получить пользователя по ID
  async getUserById(id: number) {
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
        },
        role: true
      }
    });

    if (!user) return null;
    return new SafeUserDto(user);
  }

  // Создать пользователя
  async createUser(userData: UserCreateData) {
    const { username, email, password } = userData;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Обновить пользователя
  async updateUser(id: number, userData: UserUpdateData) {
    const updateData: any = {};
    
    if (userData.email) updateData.email = userData.email;
    if (userData.username) updateData.username = userData.username;
    if (userData.password) updateData.password = bcrypt.hashSync(userData.password, 10);
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Удалить пользователя
  async deleteUser(id: number) {
    await prisma.user.delete({
      where: { id }
    });
    return true;
  }

  // Найти пользователя по email
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // Найти пользователя по username
  async findByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username }
    });
  }
}

export default new UserService();