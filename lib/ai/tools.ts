import { prisma } from "@/lib/ai/db/prisma";
import { searchDocuments } from "@/lib/rag/search";

type AgentUser = {
  id: string;
  role: "MANAGER" | "OWNER";
};

/**
 * Check whether an apartment belongs to the current user.
 *
 * Managers can access everything.
 * Owners can only access apartments where ownerId matches their user ID.
 */
function canAccessApartment(
  apartmentOwnerId: string | null,
  user: AgentUser
) {
  if (user.role === "MANAGER") {
    return true;
  }

  return apartmentOwnerId === user.id;
}

/**
 * Search the RAG knowledge base.
 *
 * The knowledge base contains general property-management rules,
 * so both managers and owners can use it.
 */
export async function searchKnowledgeBase(
  query: string
) {
  const results = await searchDocuments(query, 5);

  return results.map((result) => ({
    content: result.content,
    similarity: result.similarity,
  }));
}

/**
 * Find contracts that are expiring before a specific date.
 *
 * Managers:
 *   Can see all contracts.
 *
 * Owners:
 *   Can only see contracts belonging to tenants
 *   living in apartments they own.
 */
export async function findExpiringContracts(
  beforeDate: string,
  user: AgentUser
) {
  const contracts =
    await prisma.contract.findMany({
      where: {
        endDate: {
          lte: new Date(beforeDate),
        },

        status: "ACTIVE",

        ...(user.role === "OWNER"
          ? {
              tenant: {
                apartment: {
                  ownerId: user.id,
                },
              },
            }
          : {}),
      },

      include: {
        tenant: {
          include: {
            apartment: {
              include: {
                property: true,
              },
            },
          },
        },
      },

      orderBy: {
        endDate: "asc",
      },
    });

  return contracts.map((contract) => ({
    tenantName: contract.tenant.name,
    tenantEmail: contract.tenant.email,
    apartmentNumber:
      contract.tenant.apartment.number,
    propertyName:
      contract.tenant.apartment.property.name,
    propertyAddress:
      contract.tenant.apartment.property.address,
    contractEndDate:
      contract.endDate.toISOString(),
    monthlyRent: contract.monthlyRent,
  }));
}

/**
 * Get complete context about a tenant.
 *
 * Managers:
 *   Can access any tenant.
 *
 * Owners:
 *   Can only access tenants whose apartment
 *   belongs to them.
 */
export async function getTenantContext(
  tenantName: string,
  user: AgentUser
) {
  const tenant =
    await prisma.tenant.findFirst({
      where: {
        name: {
          equals: tenantName,
          mode: "insensitive",
        },

        ...(user.role === "OWNER"
          ? {
              apartment: {
                ownerId: user.id,
              },
            }
          : {}),
      },

      include: {
        apartment: {
          include: {
            property: true,

            maintenanceRequests: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },

        contracts: {
          orderBy: {
            endDate: "desc",
          },
        },
      },
    });

  if (!tenant) {
    return {
      found: false,
      message:
        "No accessible tenant was found with that name.",
    };
  }

  return {
    found: true,

    tenant: {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
    },

    apartment: {
      number: tenant.apartment.number,
      floor: tenant.apartment.floor,
      rooms: tenant.apartment.rooms,
      status: tenant.apartment.status,
    },

    property: {
      name: tenant.apartment.property.name,
      address:
        tenant.apartment.property.address,
      city: tenant.apartment.property.city,
    },

    maintenanceRequests:
      tenant.apartment.maintenanceRequests.map(
        (request) => ({
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: request.status,
          createdAt:
            request.createdAt.toISOString(),
        })
      ),

    contracts: tenant.contracts.map(
      (contract) => ({
        startDate:
          contract.startDate.toISOString(),

        endDate:
          contract.endDate.toISOString(),

        monthlyRent: contract.monthlyRent,
        status: contract.status,
      })
    ),
  };
}

/**
 * Create a maintenance request.
 *
 * Managers:
 *   Can create for any tenant.
 *
 * Owners:
 *   Can only create maintenance requests
 *   for tenants living in apartments they own.
 */
export async function createMaintenanceRequest(
  tenantName: string,
  title: string,
  description: string,
  priority: string,
  user: AgentUser
) {
  const tenant =
    await prisma.tenant.findFirst({
      where: {
        name: {
          equals: tenantName,
          mode: "insensitive",
        },

        ...(user.role === "OWNER"
          ? {
              apartment: {
                ownerId: user.id,
              },
            }
          : {}),
      },
    });

  if (!tenant) {
    return {
      success: false,
      message:
        "No accessible tenant was found with that name.",
    };
  }

  const maintenanceRequest =
    await prisma.maintenanceRequest.create({
      data: {
        apartmentId: tenant.apartmentId,
        tenantId: tenant.id,
        title,
        description,
        priority,
        status: "OPEN",
      },
    });

  return {
    success: true,

    message:
      "Maintenance request created successfully.",

    request: {
      id: maintenanceRequest.id,
      tenantName: tenant.name,
      title: maintenanceRequest.title,
      description:
        maintenanceRequest.description,
      priority: maintenanceRequest.priority,
      status: maintenanceRequest.status,
      createdAt:
        maintenanceRequest.createdAt.toISOString(),
    },
  };
}

/**
 * Get open maintenance requests for a tenant.
 *
 * Managers:
 *   Can see any tenant.
 *
 * Owners:
 *   Can only see tenants in their apartments.
 */
export async function getOpenMaintenanceRequests(
  tenantName: string,
  user: AgentUser
) {
  const tenant =
    await prisma.tenant.findFirst({
      where: {
        name: {
          equals: tenantName,
          mode: "insensitive",
        },

        ...(user.role === "OWNER"
          ? {
              apartment: {
                ownerId: user.id,
              },
            }
          : {}),
      },
    });

  if (!tenant) {
    return {
      found: false,
      message:
        "No accessible tenant was found with that name.",
    };
  }

  const requests =
    await prisma.maintenanceRequest.findMany({
      where: {
        tenantId: tenant.id,

        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return {
    found: true,
    tenantName: tenant.name,

    requests: requests.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      createdAt:
        request.createdAt.toISOString(),
    })),
  };
}