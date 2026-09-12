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
export const getTenantContextTool = {
  name: "get_tenant_context",

  description:
    "Find a tenant and retrieve their apartment information, property information, maintenance requests, and rental contracts. Use this when the user asks about a specific tenant or an issue involving a tenant's apartment.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      tenantName: {
        type: Type.STRING,
        description:
          "The full name of the tenant to search for.",
      },
    },

    required: ["tenantName"],
  },
};

export const createMaintenanceRequestTool = {
  name: "create_maintenance_request",

  description:
    "Create a new maintenance request for a tenant's apartment. Use this when a tenant or property manager asks to report a new maintenance problem or create a maintenance ticket.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      tenantName: {
        type: Type.STRING,
        description:
          "The full name of the tenant reporting the maintenance problem.",
      },

      title: {
        type: Type.STRING,
        description:
          "A short title describing the maintenance problem.",
      },

      description: {
        type: Type.STRING,
        description:
          "A detailed description of the maintenance problem.",
      },

      priority: {
        type: Type.STRING,
        description:
          "The priority of the maintenance request. Use LOW, MEDIUM, or HIGH. Infer the priority from the severity of the problem when possible. Use HIGH for emergencies such as heating failure, major leaks, serious electrical problems, or security issues.",
      },
    },

    required: [
      "tenantName",
      "title",
      "description",

    ],
  },
};
export const getOpenMaintenanceRequestsTool = {
  name: "get_open_maintenance_requests",

  description:
    "Find existing open or in-progress maintenance requests for a specific tenant. Use this before creating a new maintenance request to avoid creating duplicate requests.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      tenantName: {
        type: Type.STRING,
        description:
          "The full name of the tenant.",
      },
    },

    required: ["tenantName"],
  },
};