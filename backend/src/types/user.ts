import { SafeUserDto } from "../dto/userResponce";


export type UserCode = {
    userId: number;
    email: string;
    username: string;
    iat?: number;
    exp?: number;

}
export type UserFromDB = {
    id: number;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    posts?: {
        id: number;
        title: string;
        createdAt: Date;
    }[];
}

export type UserResponce = {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    posts?: {
        id: number;
        title: string;
        createdAt: Date;
    }[];
}

export type MeResponse = {
    user: SafeUserDto;
}