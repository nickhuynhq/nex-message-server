import { PrismaClient } from "@prisma/client";
import {Session} from "next-auth"

export interface GraphQLConext {
    session: Session | null;
    prisma: PrismaClient;
    // pubsub
}