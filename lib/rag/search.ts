import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/ai/db/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function searchDocuments(
  query: string,
  limit = 5
) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
  });

  const embedding =
    result.embeddings?.[0]?.values ?? [];

  if (!embedding.length) {
    return [];
  }

  const vector = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRaw<
    {
      id: string;
      content: string;
      documentId: string;
      similarity: number;
    }[]
  >`
    SELECT
      id,
      content,
      "documentId",
      1 - (embedding <=> ${vector}::vector) AS similarity
    FROM "DocumentChunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit};
  `;

  return results;
}