import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import {
  findExpiringContracts,
  searchKnowledgeBase,
  getTenantContext,
  createMaintenanceRequest,
  getOpenMaintenanceRequests,
} from "@/lib/ai/tools";

import {
  findExpiringContractsTool,
  searchKnowledgeBaseTool,
  getTenantContextTool,
  createMaintenanceRequestTool,
  getOpenMaintenanceRequestsTool,
} from "@/lib/ai/definitions";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const tools = [
  {
    functionDeclarations: [
      findExpiringContractsTool,
      searchKnowledgeBaseTool,
      getTenantContextTool,
      createMaintenanceRequestTool,
      getOpenMaintenanceRequestsTool,
    ],
  },
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Conversation history between the user and Gemini
    const contents: any[] = [
      {
        role: "user",
        parts: [
          {
            text: message,
          },
        ],
      },
    ];

    // Allow Gemini to use multiple tools
    for (let step = 0; step < 5; step++) {
      console.log(`\n--- Agent step ${step + 1} ---`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents,

        config: {
          tools,
        },
      });

      const functionCalls = response.functionCalls ?? [];

      // Gemini has finished and doesn't need another tool
      if (functionCalls.length === 0) {
        console.log("Gemini finished.");

        return NextResponse.json({
          answer: response.text,
        });
      }

      console.log(
        "Gemini requested:",
        functionCalls.map((call) => call.name)
      );

      // Add Gemini's response containing the function call
      const modelParts =
        response.candidates?.[0]?.content?.parts ?? [];

      contents.push({
        role: "model",
        parts: modelParts,
      });

      // Execute all requested tools
      const functionResponseParts: any[] = [];

      for (const functionCall of functionCalls) {
        console.log(
          "Tool:",
          functionCall.name
        );

        console.log(
          "Arguments:",
          functionCall.args
        );

        let result;

        // Tool 1: Find expiring contracts
        if (
          functionCall.name ===
          "find_expiring_contracts"
        ) {
          const args = functionCall.args as {
            beforeDate: string;
          };

          result = await findExpiringContracts(
            args.beforeDate
          );
        }

        // Tool 2: Search knowledge base
        else if (
          functionCall.name ===
          "search_knowledge_base"
        ) {
          const args = functionCall.args as {
            query: string;
          };

          result = await searchKnowledgeBase(
            args.query
          );
        }

        // Tool 3: Get tenant context
        else if (
          functionCall.name ===
          "get_tenant_context"
        ) {
          const args = functionCall.args as {
            tenantName: string;
          };

          result = await getTenantContext(
            args.tenantName
          );
        }
        
        // Tool 4: Create maintenance request
else if (
  functionCall.name ===
  "create_maintenance_request"
) {
  const args = functionCall.args as {
    tenantName: string;
    title: string;
    description: string;
    priority?: string;
  };

  result = await createMaintenanceRequest(
    args.tenantName,
    args.title,
    args.description,
    args.priority ?? "medium"
  );
}
// Tool 5: Check existing maintenance requests
else if (
  functionCall.name ===
  "get_open_maintenance_requests"
) {
  const args = functionCall.args as {
    tenantName: string;
  };

  result = await getOpenMaintenanceRequests(
    args.tenantName
  );
}
        // Unknown tool
        else {
          return NextResponse.json(
            {
              error: `Unknown tool: ${functionCall.name}`,
            },
            {
              status: 400,
            }
          );
        }

        console.log(
          "Tool result:",
          result
        );

        functionResponseParts.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              result,
            },
          },
        });
      }

      // Give all tool results back to Gemini
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    }

    // Safety limit
    return NextResponse.json(
      {
        error:
          "Agent reached the maximum number of steps.",
      },
      {
        status: 500,
      }
    );
  } catch (error) {
    console.error(
      "Agent error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong with the AI agent.",
      },
      {
        status: 500,
      }
    );
  }
}