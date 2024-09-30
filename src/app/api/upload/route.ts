import { NextRequest, NextResponse } from "next/server";
import { runWithAmplifyServerContext, reqResBasedClient } from "@/lib/utils";

// Mutation to create law
const createLawQuery = /* GraphQL */ `
  mutation CreateLaw($input: CreateLawInput!) {
    createLaw(input: $input) {
      id
      name
      jurisdiction
      source
      lastReformDate
    }
  }
`;

// Function to ensure date is in ISO 8601 format
const formatDateToISO8601 = (date: string) => {
  try {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString(); // Converts to YYYY-MM-DDTHH:mm:ss.sssZ format
    }
  } catch (error) {
    console.error(`Error parsing date: ${date}`, error);
  }
  return null; // Return null if the date is invalid or couldn't be parsed
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as Blob;

  if (!file) {
    return new NextResponse(JSON.stringify({ error: "No file provided" }), {
      status: 400,
    });
  }

  // Read the file as text
  const data = await file.text();
  const rows = data.split("\n").filter((row) => row.trim() !== ""); // Remove empty lines
  const headers = rows[0].split(",");

  const rowsData = rows.slice(1).map((row: string) => {
    const rowData = row.split(",");
    return headers.reduce(
      (acc: Record<string, string>, header: string, i: number) => {
        acc[header] = rowData[i];
        return acc;
      },
      {}
    );
  });

  let successCount = 0;
  let errorCount = 0;

  // Loop through each row and create a law
  for (const rowData of rowsData) {
    const input = {
      id: rowData["id"], // assuming the CSV has an 'id' column
      name: rowData["title"],
      jurisdiction: rowData["jurisdiction"],
      source: rowData["source"],
      lastReformDate:
        formatDateToISO8601(rowData["lastReformDate"]) ||
        "1970-01-01T00:00:00Z", // Default to an arbitrary valid date
    };

    try {
      await runWithAmplifyServerContext({
        nextServerContext: { request: req, response: new NextResponse() },
        operation: async (contextSpec) => {
          const request = (await reqResBasedClient.graphql(contextSpec, {
            query: createLawQuery,
            variables: { input },
          })) as { data: { createLaw: { id: string } } };

          if (request.data.createLaw.id) {
            successCount++;
          }
        },
      });
    } catch (e) {
      console.error(`Error creating law: ${input.name}`, e);
      errorCount++;
    }
  }

  return new NextResponse(
    JSON.stringify({
      success: true,
      message: `Laws created: ${successCount}, Errors: ${errorCount}`,
    }),
    {
      status: 200,
    }
  );
}
