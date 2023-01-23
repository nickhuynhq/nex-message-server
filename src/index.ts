import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { json } from "body-parser";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import http from "http";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { getSession } from "next-auth/react";
import {unstable_getServerSession} from "next-auth/next";
import { GraphQLContext, Session, SubscriptionContext } from "./util/types";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import * as dotenv from "dotenv";

async function main() {
  dotenv.config();
  const app = express();
  const httpServer = http.createServer(app);

  // Creating the WebSocket subscription server
  const wsServer = new WebSocketServer({
    // This is the `httpServer` returned by createServer(app);
    server: httpServer,
    // Pass a different path here if your ApolloServer serves at
    // a different path.
    path: "/graphql/subscriptions",
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Context parameters
  const prisma = new PrismaClient();
  const pubsub = new PubSub();

  // Passing in an instance of a GraphQLSchema and
  // telling the WebSocketServer to start listening
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
        if (ctx.connectionParams && ctx.connectionParams.session) {
          const { session } = ctx.connectionParams;

          return { session, prisma, pubsub };
        }

        return { session: null, prisma, pubsub };
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  };

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const session = await getSession({ req });
        console.log("REQUEST", req);
        console.log("SESSION INDEX", session);
        return { session: session as Session, prisma, pubsub };
      },
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4000}, resolve)
  );
  console.log(`Server is now running on http://localhost:${process.env.PORT}/graphql`);
}

main().catch((error) => console.log(error));
