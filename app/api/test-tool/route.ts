import { NextResponse } from "next/server";
import { findExpiringContracts } from "@/lib/ai/tools";

export async function GET() {
  try {
    const result = await findExpiringContracts(
      "2026-09-20"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to find contracts" },
      { status: 500 }
    );
  }
}