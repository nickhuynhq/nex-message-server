import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { GraphQLContext, SendMessageArguments } from "../../util/types";

const resolvers = {
  Query: {},

  Mutation: {
    sendMessage: async function (
      _: any,
      args: SendMessageArguments,
      context: GraphQLContext
    ): Promise<boolean> {
      const { session, prisma, pubsub } = context;
      const { id: messageId, senderId, conversationId, body } = args;

      if (!session?.user) {
        throw new GraphQLError("Not Authorized");
      }

      const { id: userId } = session.user;

      // Extra check to see if user IDs match
      // Prevent Users from sending messages on others behalf
      if (userId !== senderId) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        // Create a new message entity
        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body,
          },
          include: messagePopulated,
        });

        // Update conversation entity
        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              // Update when User(sender) sends message, they have already seen it
              update: {
                where: {
                  id: senderId,
                },
                data: {
                  hasSeenLatestMessage: true,
                },
              },
              // Update other participants so that message sent is set to "not seen"
              updateMany: {
                where: {
                  NOT: {
                    userId: senderId,
                  },
                },
                data: {
                  hasSeenLatestMessage: false,
                },
              },
            },
          },
        });

        // Alert clients that message is sent
        pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation,
          },
        });
      } catch (error: any) {
        console.log("sendMessage error", error);
        throw new GraphQLError("Error sending message");
      }

      return true;
    },
  },

  Subscription: {},
};

// Prisma validator that represent strucuture of entity returned from DB
export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
