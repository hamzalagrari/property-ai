import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import {
  findExpiringContracts,
  searchKnowledgeBase,
} from "@/lib/ai/tools";

import {
  findExpiringContractsTool,
  searchKnowledgeBaseTool,
} from "@/lib/ai/definitions";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const tools = [
  {
    functionDeclarations: [
      findExpiringContractsTool,
      searchKnowledgeBaseTool,
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

    // Ask Gemini what it wants to do
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        tools,
      },
    });

    const functionCall = response.functionCalls?.[0];

    // Gemini doesn't need a tool
    if (!functionCall) {
      return NextResponse.json({
        answer: response.text,
      });
    }

    console.log(
      "Gemini requested tool:",
      functionCall.name
    );

    console.log(
      "Tool arguments:",
      functionCall.args
    );

    let result;

    // Tool 1: Database search
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

    // Tool 2: RAG knowledge base search
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

    // Give the tool result back to Gemini
    const finalResponse =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },

          {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: functionCall.name,
                  args: functionCall.args,
                },
              },
            ],
          },

          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    result,
                  },
                },
              },
            ],
          },
        ],

        config: {
          tools,
        },
      });

    return NextResponse.json({
      answer: finalResponse.text,
    });
  } catch (error) {
    console.error("Agent error:", error);

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