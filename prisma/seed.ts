import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ApartmentStatus,
} from "../app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.maintenanceRequest.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.property.deleteMany();

  // Create property
  const property = await prisma.property.create({
    data: {
      name: "Berlin Central Apartments",
      address: "Alexanderplatz 12",
      city: "Berlin",
    },
  });

  console.log("🏢 Property created");

  // -------------------------
  // APARTMENTS
  // -------------------------

  const apartments = [];

  for (let i = 1; i <= 50; i++) {
    const floor = Math.floor((i - 1) / 10) + 1;

    let status: ApartmentStatus;

    if (i <= 35) {
      status = ApartmentStatus.OCCUPIED;
    } else if (i <= 45) {
      status = ApartmentStatus.VACANT;
    } else {
      status = ApartmentStatus.MAINTENANCE;
    }

    const apartment = await prisma.apartment.create({
      data: {
        number: `${floor}${String(((i - 1) % 10) + 1).padStart(2, "0")}`,
        floor,
        rooms: [1, 2, 2, 3, 3, 4][i % 6],
        status,
        propertyId: property.id,
      },
    });

    apartments.push(apartment);
  }

  console.log("🏠 50 apartments created");

  // -------------------------
  // TENANTS
  // -------------------------

  const tenantData = [
    ["Michael Schmidt", "michael.schmidt@example.com"],
    ["Anna Müller", "anna.mueller@example.com"],
    ["John Smith", "john.smith@example.com"],
    ["Sarah Weber", "sarah.weber@example.com"],
    ["Thomas Fischer", "thomas.fischer@example.com"],
    ["Laura Wagner", "laura.wagner@example.com"],
    ["Daniel Becker", "daniel.becker@example.com"],
    ["Sophie Hoffmann", "sophie.hoffmann@example.com"],
    ["David Schäfer", "david.schaefer@example.com"],
    ["Emma Koch", "emma.koch@example.com"],
    ["Max Bauer", "max.bauer@example.com"],
    ["Lisa Richter", "lisa.richter@example.com"],
    ["Paul Klein", "paul.klein@example.com"],
    ["Julia Wolf", "julia.wolf@example.com"],
    ["Lukas Schröder", "lukas.schroeder@example.com"],
    ["Mia Neumann", "mia.neumann@example.com"],
    ["Felix Schwarz", "felix.schwarz@example.com"],
    ["Lea Zimmermann", "lea.zimmermann@example.com"],
    ["Jonas Braun", "jonas.braun@example.com"],
    ["Hannah Krüger", "hannah.krueger@example.com"],
    ["Ben Hartmann", "ben.hartmann@example.com"],
    ["Clara Lange", "clara.lange@example.com"],
    ["Noah Schmitt", "noah.schmitt@example.com"],
    ["Marie Werner", "marie.werner@example.com"],
    ["Elias Schmitz", "elias.schmitz@example.com"],
    ["Amelie Krause", "amelie.krause@example.com"],
    ["Leon Meier", "leon.meier@example.com"],
    ["Nina Lehmann", "nina.lehmann@example.com"],
    ["Tim Herrmann", "tim.herrmann@example.com"],
    ["Sophie König", "sophie.koenig@example.com"],
    ["Jan Walter", "jan.walter@example.com"],
    ["Lena Mayer", "lena.mayer@example.com"],
    ["Moritz Huber", "moritz.huber@example.com"],
    ["Emily Kaiser", "emily.kaiser@example.com"],
    ["Niklas Fuchs", "niklas.fuchs@example.com"],
  ];

  const tenants = [];

  for (let i = 0; i < 35; i++) {
    const apartment = apartments[i];

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantData[i][0],
        email: tenantData[i][1],
        phone: `+49 151 ${10000000 + i}`,
        apartmentId: apartment.id,
      },
    });

    tenants.push(tenant);
  }

  console.log("👤 35 tenants created");

  // -------------------------
  // CONTRACTS
  // -------------------------

  for (let i = 0; i < 40; i++) {
    const tenant = tenants[i % tenants.length];

    const startDate = new Date("2025-09-01");

    let endDate: Date;

    // Make some contracts expire soon
    if (i < 5) {
      endDate = new Date("2026-09-15");
    } else if (i < 10) {
      endDate = new Date("2026-10-01");
    } else {
      endDate = new Date("2027-09-01");
    }

    const monthlyRent =
      700 + (i % 6) * 100;

    await prisma.contract.create({
      data: {
        tenantId: tenant.id,
        startDate,
        endDate,
        monthlyRent,
        status: "ACTIVE",
      },
    });
  }

  console.log("📄 40 contracts created");

  // -------------------------
  // MAINTENANCE REQUESTS
  // -------------------------

  const maintenanceData = [
    [
      "Heating not working",
      "The heating system in the apartment is not producing heat.",
      "HIGH",
      "OPEN",
    ],
    [
      "Leaking kitchen sink",
      "Water is leaking underneath the kitchen sink.",
      "MEDIUM",
      "OPEN",
    ],
    [
      "Broken window",
      "The bedroom window does not close properly.",
      "MEDIUM",
      "IN_PROGRESS",
    ],
    [
      "Bathroom light broken",
      "The main bathroom light stopped working.",
      "LOW",
      "OPEN",
    ],
    [
      "Water pressure issue",
      "The water pressure in the shower is very low.",
      "MEDIUM",
      "OPEN",
    ],
    [
      "Broken door lock",
      "The apartment entrance lock is difficult to open.",
      "HIGH",
      "IN_PROGRESS",
    ],
    [
      "Radiator leaking",
      "Small leak coming from the bedroom radiator.",
      "HIGH",
      "OPEN",
    ],
    [
      "Dishwasher broken",
      "Dishwasher is not starting.",
      "LOW",
      "OPEN",
    ],
    [
      "Internet connection issue",
      "Internet connection has been unstable.",
      "LOW",
      "RESOLVED",
    ],
    [
      "Electrical outlet broken",
      "Living room outlet is not working.",
      "MEDIUM",
      "OPEN",
    ],
    [
      "Elevator noise",
      "Elevator is making unusual noises.",
      "MEDIUM",
      "IN_PROGRESS",
    ],
    [
      "Mold in bathroom",
      "Tenant reports mold around the bathroom ceiling.",
      "HIGH",
      "OPEN",
    ],
    [
      "Broken refrigerator",
      "Refrigerator stopped cooling properly.",
      "MEDIUM",
      "OPEN",
    ],
    [
      "Ceiling leak",
      "Water stain and leaking from the ceiling.",
      "HIGH",
      "OPEN",
    ],
    [
      "Heating thermostat broken",
      "Thermostat does not respond to temperature changes.",
      "MEDIUM",
      "RESOLVED",
    ],
  ];

  for (let i = 0; i < maintenanceData.length; i++) {
    const apartment = apartments[i];
    const tenant = tenants[i % tenants.length];

    await prisma.maintenanceRequest.create({
      data: {
        apartmentId: apartment.id,
        tenantId: tenant.id,
        title: maintenanceData[i][0],
        description: maintenanceData[i][1],
        priority: maintenanceData[i][2],
        status: maintenanceData[i][3],
      },
    });
  }

  console.log("🔧 15 maintenance requests created");

  console.log("✅ Database seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });