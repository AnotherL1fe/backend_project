import { UserResponce } from "../types/user";

export class SafeUserDto{
    id: number
    email: string
    username: string
    constructor(user: UserResponce){
        this.id = user.id
        this.username = user.username
        this.email = user.email
    }
}