import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/ai/db/prisma";

async function main() {
  const managerPassword =
    await bcrypt.hash(
      "Manager123!",
      12
    );

  const ownerPassword =
    await bcrypt.hash(
      "Owner123!",
      12
    );

  const manager =
    await prisma.user.upsert({
      where: {
        email: "manager@propertyai.com",
      },

      update: {
        password: managerPassword,
        role: "MANAGER",
      },

      create: {
        name: "Property Manager",
        email: "manager@propertyai.com",
        password: managerPassword,
        role: "MANAGER",
      },
    });

  const owner =
    await prisma.user.upsert({
      where: {
        email: "owner@propertyai.com",
      },

      update: {
        password: ownerPassword,
        role: "OWNER",
      },

      create: {
        name: "Property Owner",
        email: "owner@propertyai.com",
        password: ownerPassword,
        role: "OWNER",
      },
    });

  console.log("Manager created:", {
    id: manager.id,
    email: manager.email,
    role: manager.role,
  });

  console.log("Owner created:", {
    id: owner.id,
    email: owner.email,
    role: owner.role,
  });
}

main()
  .catch((error) => {
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });