import { NextResponse } from "next/server";

import { getTenantContext } from "@/lib/ai/tools";

export async function GET() {
  try {
    const result = await getTenantContext(
      "Michael Schmidt"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to get tenant context",
      },
      {
        status: 500,
      }
    );
  }
}