import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../db";

const router = Router();

type UserBase = {
    email: string,
    username:string,
}
type UserProp = {password: string} & UserBase
export async function createUser(user:UserProp): Promise<UserBase | undefined> {
    try {
        const { username, email, password } = user;
        
        console.log("Register attempt:", { username, email });

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });
        
        console.log("User saved to DB:", newUser.id);
        
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword
        
    } catch (error) {
        console.error("Registration error:", error);       
    }
};

export default router;