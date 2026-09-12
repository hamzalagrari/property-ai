import "dotenv/config";

import { ingestDocument } from "../lib/rag/ingest";

async function main() {
  console.log("🌱 Starting RAG seed...");

  const buildingRules = `
Berlin Central Apartments
Building Rules and Tenant Handbook

Property:
Berlin Central Apartments
Address: Alexanderplatz 12, Berlin

PETS:
Pets are allowed in the apartments with prior written approval from property management.
Tenants must make sure that pets do not disturb other residents.
Pets must be kept under control in all common areas.

QUIET HOURS:
Quiet hours are from 22:00 to 07:00.
Tenants should avoid loud music, parties, and other excessive noise during these hours.

COMMON AREAS:
Tenants must keep hallways, staircases, elevators, and other common areas clean.
Personal belongings must not be stored in hallways or emergency exits.

MAINTENANCE:
Tenants should report maintenance problems to property management as soon as possible.
Emergency problems such as major water leaks, heating failure during cold weather, or serious electrical problems should be reported immediately.

HEATING:
If the heating system is not working, the tenant should first check whether the thermostat is correctly configured.
If the problem continues, the tenant should contact property management.

RENT:
Monthly rent must be paid according to the payment schedule specified in the rental contract.
Late payments may result in additional fees according to the rental agreement.

PARKING:
Parking spaces require prior registration with property management.
Visitors may only use designated visitor parking spaces.

SMOKING:
Smoking is not permitted in hallways, staircases, elevators, or other indoor common areas.
`;

  const document = await ingestDocument(
    "building-rules.txt",
    "text",
    buildingRules
  );

  console.log("✅ RAG document created:", document.id);
  console.log("🎉 RAG seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ RAG seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit());