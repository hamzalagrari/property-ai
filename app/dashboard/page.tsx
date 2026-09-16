import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/ai/db/prisma";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isOwner = session.user.role === "OWNER";

  const apartments = await prisma.apartment.findMany({
    where: isOwner
      ? { ownerId: session.user.id }
      : undefined,
    include: {
      property: true,
    },
    orderBy: [
      { property: { name: "asc" } },
      { number: "asc" },
    ],
  });

  const requests = await prisma.maintenanceRequest.findMany({
    where: isOwner
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

  const statusCounts = apartments.reduce(
    (counts, apartment) => {
      counts[apartment.status] += 1;
      return counts;
    },
    {
      OCCUPIED: 0,
      VACANT: 0,
      MAINTENANCE: 0,
    }
  );

  function formatStatus(status: string) {
    return status.replace("_", " ");
  }

  function statusClass(status: string) {
    if (status === "OCCUPIED") return "resolved";
    if (status === "MAINTENANCE") return "open";
    return "in-progress";
  }

  function requestStatusClass(status: string) {
    if (status === "OPEN") return "open";
    if (status === "RESOLVED") return "resolved";
    return "in-progress";
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="login-logo">P</div>
          <div>
            <h1>PropertyAI</h1>
            <p>{isOwner ? "Owner workspace" : "Manager workspace"}</p>
          </div>
        </div>

        <div className="dashboard-user">
          <div>
            <strong>{session.user.name}</strong>
            <small>{session.user.email}</small>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-intro">
          <div>
            <span className="login-eyebrow">
              {isOwner ? "OWNER VIEW" : "MANAGER VIEW"}
            </span>
            <h2>
              {isOwner ? "My maintenance history" : "Property overview"}
            </h2>
            <p>
              {isOwner
                ? "Track maintenance requests for your assigned properties."
                : "Monitor apartment occupancy and maintenance across your portfolio."}
            </p>
          </div>
        </div>

        {!isOwner && (
          <div className="status-grid">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div className="status-card" key={status}>
                <span className={`state ${statusClass(status)}`}>
                  {formatStatus(status)}
                </span>
                <strong>{count}</strong>
                <small>apartments</small>
              </div>
            ))}
          </div>
        )}

        {!isOwner && (
          <section className="dashboard-section">
            <h3>Properties and apartment status</h3>
            <div className="dashboard-list">
              {apartments.map((apartment) => (
                <article className="dashboard-row" key={apartment.id}>
                  <div>
                    <strong>{apartment.property.name}</strong>
                    <small>
                      Unit {apartment.number} · {apartment.rooms} rooms · Floor {apartment.floor}
                    </small>
                  </div>
                  <span className={`state ${statusClass(apartment.status)}`}>
                    {formatStatus(apartment.status)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="dashboard-section">
          <h3>{isOwner ? "My previous maintenance requests" : "Recent maintenance requests"}</h3>
          <div className="dashboard-list">
            {requests.length === 0 ? (
              <p>No maintenance requests found.</p>
            ) : (
              requests.map((request) => (
                <article className="dashboard-row" key={request.id}>
                  <div>
                    <strong>{request.title}</strong>
                    <small>
                      {request.apartment.property.name} · Unit {request.apartment.number}
                      {!isOwner && request.apartment.tenants[0]
                        ? ` · ${request.apartment.tenants[0].name}`
                        : ""}
                    </small>
                  </div>
                  <div className="dashboard-row-meta">
                    <span className={`state ${requestStatusClass(request.status)}`}>
                      {formatStatus(request.status)}
                    </span>
                    <small>{request.createdAt.toLocaleDateString("en-GB")}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}