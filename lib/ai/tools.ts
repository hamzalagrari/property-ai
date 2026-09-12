import { prisma } from "@/lib/ai/db/prisma";
import { searchDocuments } from "@/lib/rag/search";

export async function searchKnowledgeBase(
  query: string
) {
  const results = await searchDocuments(query, 5);

  return results.map((result) => ({
    content: result.content,
    similarity: result.similarity,
  }));
}

export async function findExpiringContracts(
  beforeDate: string
) {
  const contracts = await prisma.contract.findMany({
    where: {
      endDate: {
        lte: new Date(beforeDate),
      },
      status: "ACTIVE",
    },
    include: {
      tenant: {
        include: {
          apartment: true,
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
    apartmentNumber: contract.tenant.apartment.number,
    contractEndDate: contract.endDate.toISOString(),
    monthlyRent: contract.monthlyRent,
  }));
}
export async function getTenantContext(
  tenantName: string
) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      name: {
        equals: tenantName,
        mode: "insensitive",
      },
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
      message: `No tenant found with the name ${tenantName}.`,
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
      address: tenant.apartment.property.address,
      city: tenant.apartment.property.city,
    },

    maintenanceRequests:
      tenant.apartment.maintenanceRequests.map(
        (request) => ({
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        })
      ),

    contracts: tenant.contracts.map(
      (contract) => ({
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        monthlyRent: contract.monthlyRent,
        status: contract.status,
      })
    ),
  };
}
export async function createMaintenanceRequest(
  tenantName: string,
  title: string,
  description: string,
  priority: string
) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      name: {
        equals: tenantName,
        mode: "insensitive",
      },
    },
  });

  if (!tenant) {
    return {
      success: false,
      message: `No tenant found with the name ${tenantName}.`,
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
    message: "Maintenance request created successfully.",

    request: {
      id: maintenanceRequest.id,
      tenantName: tenant.name,
      title: maintenanceRequest.title,
      description: maintenanceRequest.description,
      priority: maintenanceRequest.priority,
      status: maintenanceRequest.status,
      createdAt:
        maintenanceRequest.createdAt.toISOString(),
    },
  };
}
export async function getOpenMaintenanceRequests(
  tenantName: string
) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      name: {
        equals: tenantName,
        mode: "insensitive",
      },
    },
  });

  if (!tenant) {
    return {
      found: false,
      message: `No tenant found with the name ${tenantName}.`,
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