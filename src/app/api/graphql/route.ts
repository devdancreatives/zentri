import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { NextRequest, NextResponse } from "next/server";

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

// Wrappers for Next.js App Router
export async function GET(request: NextRequest, context: any) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return handleRequest(request, context);
}
