import { Type } from "@google/genai";

export const findExpiringContractsTool = {
  name: "find_expiring_contracts",

  description:
    "Find rental contracts that expire on or before a specified date. Use this when the user asks which contracts or tenants are expiring soon.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      beforeDate: {
        type: Type.STRING,
        description:
          "The date to search up to in YYYY-MM-DD format.",
      },
    },

    required: ["beforeDate"],
  },
};

export const searchKnowledgeBaseTool = {
  name: "search_knowledge_base",

  description:
    "Search property management documents, rental policies, building rules, and other uploaded documents for relevant information.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      query: {
        type: Type.STRING,
        description:
          "The question or information to search for.",
      },
    },

    required: ["query"],
  },
};