// import { NextRequest, NextResponse } from "next/server";
// import { runWithAmplifyServerContext, reqResBasedClient } from "@/lib/utils";

// // Mutation to create law
// const createLawQuery = /* GraphQL */ `
//   mutation CreateLaw($input: CreateLawInput!) {
//     createLaw(input: $input) {
//       id
//       name
//       jurisdiction
//       source
//       lastReformDate
//     }
//   }
// `;

// // Mutation to create a relationship between a compendium and a law
// const createCompendiumLawQuery = /* GraphQL */ `
//   mutation CreateCompendiumLaw($input: CreateCompendiumLawInput!) {
//     createCompendiumLaw(input: $input) {
//       id
//       compendiumId
//       lawId
//     }
//   }
// `;

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();
//   const file = formData.get("file") as Blob;
//   const compendiumID = formData.get("compendiumID") as string;

//   if (!file || !compendiumID) {
//     return new NextResponse(
//       JSON.stringify({ error: "File or compendiumID not provided" }),
//       { status: 400 }
//     );
//   }

//   // Read the file as text
//   const data = await file.text();
//   const rows = data.split("\n").filter((row) => row.trim() !== ""); // Remove empty lines
//   const headers = rows[0].split(",");

//   const rowsData = rows.slice(1).map((row: string) => {
//     const rowData = row.split(",");
//     return headers.reduce(
//       (acc: Record<string, string>, header: string, i: number) => {
//         acc[header] = rowData[i];
//         return acc;
//       },
//       {}
//     );
//   });

//   let successCount = 0;
//   let errorCount = 0;

//   // Loop through each row and create a law, then create the relationship with the compendium
//   for (const rowData of rowsData) {
//     const input = {
//       id: rowData["Id"], // assuming the CSV has an 'id' column
//       name: rowData["title"],
//       jurisdiction: rowData["jurisdiction"],
//       source: rowData["source"],
//       lastReformDate: rowData["last_reform_date"]
//     };

//     try {
//       // Create the law
//       const request = await runWithAmplifyServerContext({
//         nextServerContext: { request: req, response: new NextResponse() },
//         operation: async (contextSpec) => {
//           return reqResBasedClient.graphql(contextSpec, {
//             query: createLawQuery,
//             variables: { input },
//           });
//         },
//       }) as { data: { createLaw: { id: string } } };

//       const lawID = request.data.createLaw.id;

//       if (lawID) {
//         successCount++;
//         console.log(`Created law: ${input.name}, ID: ${lawID}`);

//         // Create the compendium-law relationship
//         const compendiumLawID = `${compendiumID}-${lawID}`; // Format compendiumLaw ID
//         const compendiumLawInput = {
//           id: compendiumLawID,
//           compendiumId: compendiumID,
//           lawId: lawID,
//         };

//         await runWithAmplifyServerContext({
//           nextServerContext: { request: req, response: new NextResponse() },
//           operation: async (contextSpec) => {
//             return reqResBasedClient.graphql(contextSpec, {
//               query: createCompendiumLawQuery,
//               variables: { input: compendiumLawInput },
//             });
//           },
//         });

//         console.log(`Created compendium-law relationship: ${compendiumLawID}`);
//       }
//     } catch (e) {
//       console.error(`Error creating law or compendium-law relationship: ${input.name}`, e);
//       errorCount++;
//     }
//   }

//   return new NextResponse(
//     JSON.stringify({
//       success: true,
//       message: `Laws created: ${successCount}, Errors: ${errorCount}`,
//     }),
//     {
//       status: 200,
//     }
//   );
// }