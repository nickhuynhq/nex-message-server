import {Session} from "next-auth"

export interface GraphQLConext {
    session: Session | null;
    // prisma
    // pubsub
}