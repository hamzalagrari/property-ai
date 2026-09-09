import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/ai/db/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export function splitIntoChunks(
  text: string,
  chunkSize = 1000
) {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

async function createEmbedding(text: string) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return result.embeddings?.[0]?.values ?? [];
}

export async function ingestDocument(
  name: string,
  type: string,
  content: string
) {
  const document = await prisma.document.create({
    data: {
      name,
      type,
      content,
    },
  });

  const chunks = splitIntoChunks(content);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const embedding = await createEmbedding(chunk);

    const createdChunk = await prisma.documentChunk.create({
  data: {
    documentId: document.id,
    content: chunk,
    chunkIndex: i,
  },
});

await prisma.$executeRaw`
  UPDATE "DocumentChunk"
  SET embedding = ${`[${embedding.join(",")}]`}::vector
  WHERE id = ${createdChunk.id}
`;

    console.log(
      `Created chunk ${i} with embedding of ${embedding.length} dimensions`
    );
  }

  return document;
}