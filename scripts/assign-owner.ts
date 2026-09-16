import "dotenv/config";

import { prisma } from "@/lib/ai/db/prisma";

async function main() {
  const owner = await prisma.user.findUnique({
    where: {
      email: "owner@propertyai.com",
    },
  });

  if (!owner) {
    throw new Error(
      "Owner user not found."
    );
  }

  const apartments =
    await prisma.apartment.findMany({
      where: {
        number: {
          in: ["101", "102", "103"],
        },
      },
    });

  if (apartments.length === 0) {
    throw new Error(
      "No matching apartments found."
    );
  }

  for (const apartment of apartments) {
    await prisma.apartment.update({
      where: {
        id: apartment.id,
      },
      data: {
        ownerId: owner.id,
      },
    });

    console.log(
      `Apartment ${apartment.number} assigned to ${owner.email}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });