import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/ai/db/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const requestedRole = searchParams.get("role");
    const role = session.user.role === "OWNER" ? "owner" : "manager";

    if (requestedRole && requestedRole !== role) {
      return NextResponse.json(
        { error: "Invalid workspace role." },
        { status: 403 }
      );
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where:
        role === "owner"
          ? { apartment: { ownerId: session.user.id } }
          : undefined,
      include: {
        apartment: {
          include: {
            property: true,
            tenants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const payload = requests.map((request) => {
      const tenant = request.tenantId
        ? request.apartment.tenants.find(
            (candidate) => candidate.id === request.tenantId
          ) ?? null
        : null;

      return {
        ...request,
        tenant,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Maintenance API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch maintenance requests.",
      },
      { status: 500 }
    );
  }
}