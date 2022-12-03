import { GraphQLConext } from "../../util/types";

const resolvers = {
  Query: {
    searchUsers: () => { },
  },
  Mutation: {
    createUsername: (_: any, args: { username: string }, context: GraphQLConext) => {
      const { username } = args;
      const { session, prisma } = context;
      console.log("Hit the api", username)
    },
  },
};

export default resolvers;