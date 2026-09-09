import { loadEnvFile } from "node:process";

loadEnvFile(".env");

async function main() {
  const { searchDocuments } = await import("../lib/rag/search");

  const results = await searchDocuments(
    "Are pets allowed in Building A?"
  );

  console.log(results);
}

main()
  .catch(console.error)
  .finally(() => process.exit());