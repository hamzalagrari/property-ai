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