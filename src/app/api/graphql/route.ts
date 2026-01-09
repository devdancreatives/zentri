import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// Reverting to Node.js runtime as Edge caused build errors with Buffer dependency

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  cors: false,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handle(request: NextRequest) {
  const response = await yoga.handleRequest(request, {});
  // Apply CORS headers to every response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
