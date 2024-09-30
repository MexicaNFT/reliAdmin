import { NextRequest, NextResponse } from "next/server";
import { runWithAmplifyServerContext, reqResBasedClient } from "@/lib/utils";

const getLawQuery = /* GraphQL */ `
  query GetLaw($id: ID!) {
    getLaw(id: $id) {
      id
      name
      jurisdiction
      source
      lastReformDate
    }
  }
`;

export async function GET(req: NextRequest) {
  // Get the id from the query string
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    console.log("Missing ID in the query string.");
    return new NextResponse(JSON.stringify({ error: "Missing ID" }), {
      status: 400,
    });
  }

  let law = null;

  try {
    await runWithAmplifyServerContext({
      nextServerContext: { request: req, response: new NextResponse() },
      operation: async (contextSpec) => {
        const request = (await reqResBasedClient.graphql(contextSpec, {
          query: getLawQuery,
          variables: { id }, // Pass the id directly
        })) as { data: { getLaw: { id: string } } };

        law = request.data.getLaw;
      },
    });
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: "Error getting law" }), {
      status: 500,
    });
  }

  if (!law) {
    return new NextResponse(JSON.stringify({ error: "Law not found" }), {
      status: 404,
    });
  }

  return new NextResponse(JSON.stringify({ data: { law } }), { status: 200 });
}
