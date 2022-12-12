import userResolvers from "./user";
import merge from "lodash.merge";
import conversationResolvers from "./conversation";
import messageResolvers from "./messages"

const resolvers = merge({}, userResolvers, conversationResolvers, messageResolvers);

export default resolvers;
