import { searchDocuments } from "../lib/rag/search";

async function main() {
  const results = await searchDocuments(
    "Are pets allowed in Building A?"
  );

  console.log(results);
}

main()
  .catch(console.error)
  .finally(() => process.exit());