import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

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
    /*
     * Get the authenticated user from NextAuth.
     *
     * IMPORTANT:
     * We do NOT trust role information coming from
     * the frontend or from Gemini.
     */
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const user = {
      id: session.user.id,
      role: session.user.role,
    };

    /*
     * Only our two database roles are allowed.
     */
    if (
      user.role !== "MANAGER" &&
      user.role !== "OWNER"
    ) {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

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

    /*
     * Give Gemini the user's message.
     */
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

    /*
     * Allow Gemini to use multiple tools.
     */
    for (let step = 0; step < 5; step++) {
      console.log(
        `\n--- Agent step ${step + 1} ---`
      );

      console.log(
        "Authenticated user:",
        {
          id: user.id,
          role: user.role,
        }
      );

      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",

          contents,

          config: {
            tools,
          },
        });

      const functionCalls =
        response.functionCalls ?? [];

      /*
       * Gemini has finished.
       */
      if (functionCalls.length === 0) {
        console.log(
          "Gemini finished."
        );

        return NextResponse.json({
          answer: response.text,
        });
      }

      console.log(
        "Gemini requested:",
        functionCalls.map(
          (call) => call.name
        )
      );

      /*
       * Add Gemini's function calls to history.
       */
      const modelParts =
        response.candidates?.[0]?.content
          ?.parts ?? [];

      contents.push({
        role: "model",
        parts: modelParts,
      });

      /*
       * Execute all requested tools.
       */
      const functionResponseParts: any[] =
        [];

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

        /*
         * Tool 1:
         * Find expiring contracts
         */
        if (
          functionCall.name ===
          "find_expiring_contracts"
        ) {
          const args =
            functionCall.args as {
              beforeDate: string;
            };

          result =
            await findExpiringContracts(
              args.beforeDate,
              user
            );
        }

        /*
         * Tool 2:
         * Search knowledge base
         */
        else if (
          functionCall.name ===
          "search_knowledge_base"
        ) {
          const args =
            functionCall.args as {
              query: string;
            };

          result =
            await searchKnowledgeBase(
              args.query
            );
        }

        /*
         * Tool 3:
         * Get tenant context
         */
        else if (
          functionCall.name ===
          "get_tenant_context"
        ) {
          const args =
            functionCall.args as {
              tenantName: string;
            };

          result =
            await getTenantContext(
              args.tenantName,
              user
            );
        }

        /*
         * Tool 4:
         * Create maintenance request
         */
        else if (
          functionCall.name ===
          "create_maintenance_request"
        ) {
          const args =
            functionCall.args as {
              tenantName: string;
              title: string;
              description: string;
              priority?: string;
            };

          result =
            await createMaintenanceRequest(
              args.tenantName,
              args.title,
              args.description,
              args.priority ??
                "medium",
              user
            );
        }

        /*
         * Tool 5:
         * Get open maintenance requests
         */
        else if (
          functionCall.name ===
          "get_open_maintenance_requests"
        ) {
          const args =
            functionCall.args as {
              tenantName: string;
            };

          result =
            await getOpenMaintenanceRequests(
              args.tenantName,
              user
            );
        }

        /*
         * Unknown tool
         */
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

      /*
       * Give all tool results back to Gemini.
       */
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    }

    /*
     * Safety limit.
     */
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