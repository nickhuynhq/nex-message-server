const resolvers = {
  Query: {
    searchUsers: () => {},
  },
  Mutation: {
    createUsername: () => {
      console.log("Hit the api")
    },
  },
};

export default resolvers;