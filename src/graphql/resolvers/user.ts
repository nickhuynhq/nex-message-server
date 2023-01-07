import { CreateUsernameResponse, GraphQLContext } from "../../util/types";
import {GraphQLError} from 'graphql'
import { User } from "@prisma/client";

const resolvers = {
  Query: {
    searchUsers: async (
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Array<User>> => {
      const { username: searchedUsername } = args;
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authroized");
      }

      const {
        user: { username: myUsername },
      } = session;

      try {

        // Search username where it contains the input but is not myUsername
        // Mode is set to Case insensitive ie. "T or t"
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchedUsername,
              not: myUsername,
              mode: "insensitive",
            },
          },
        });

        return users;
        
      } catch (error: any) {
        console.log("searchUsers error", error);
        throw new GraphQLError(error?.message);
      }
    },
  },

  Mutation: {
    createUsername: async (
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> => {
      const { username } = args;
      const { session, prisma } = context;
      if (!session?.user) {
        return {
          error: "Not Authorized",
        };
      }

      const { id: userId } = session.user;

      try {
        // Check if username is not taken
        const existingUser = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (existingUser) {
          return {
            error: "Username already taken. Try another",
          };
        }

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            username,
          },
        });

        return { success: true };

        // Update user
      } catch (error: any) {
        console.log("create username error", error);
        return {
          error: error?.message,
        };
      }
    },
  },
};

export default resolvers;
