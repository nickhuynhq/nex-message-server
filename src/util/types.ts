import { PrismaClient } from "@prisma/client";
import {ISODateString} from "next-auth"

export interface GraphQLConext {
    session: Session | null;
    prisma: PrismaClient;
    // pubsub
}

// Users
export interface Session {
    user: User;
    expires: ISODateString;
}

export interface User {
    id: string;
    username: string;
    email: string;
    image: string;
    name: string;
}

export interface CreateUsernameResponse {
    success?: boolean;
    error?: string;
}

//