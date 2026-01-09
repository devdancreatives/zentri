import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";

export const dynamic = "force-dynamic";

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };
