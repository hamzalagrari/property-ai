"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "manager" | "owner";

type Page = "overview" | "assistant";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;

  tenant?: {
    name: string;
  };

  apartment?: {
    number: number;

    property?: {
      name: string;
    };
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function Home() {
  // --------------------------------------------------
  // APP STATE
  // --------------------------------------------------

  const [workspace, setWorkspace] = useState(false);

  const [role, setRole] = useState<Role>("manager");

  const [page, setPage] = useState<Page>("overview");

  const [requests, setRequests] = useState<
    MaintenanceRequest[]
  >([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hello! How can I help with your property today?",
    },
  ]);

  useEffect(() => {
    const requestedWorkspace = new URLSearchParams(
      window.location.search
    ).get("workspace");

    if (
      requestedWorkspace === "manager" ||
      requestedWorkspace === "owner"
    ) {
      setRole(requestedWorkspace);
      setWorkspace(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!workspace) {
      setRequests([]);
    }
  }, [workspace]);

  // --------------------------------------------------
  // LOAD MAINTENANCE REQUESTS
  // --------------------------------------------------

  async function loadRequests(currentRole: Role) {
    try {
      const url =
        "/api/maintenance?role=" + currentRole;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Failed to load maintenance requests."
        );
      }

      const data = await response.json();

      setRequests(data);
    } catch (error) {
      console.error(
        "Failed to load maintenance requests:",
        error
      );

      setRequests([]);
    }
  }

  // Load requests whenever the role changes
  useEffect(() => {
    if (workspace) {
      loadRequests(role);
    }
  }, [role, workspace]);

  // --------------------------------------------------
  // RETURN HOME
  // --------------------------------------------------

  function goHome() {
    setWorkspace(false);

    setPage("overview");
  }

  // --------------------------------------------------
  // SEND MESSAGE TO AI AGENT
  // --------------------------------------------------

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    // Clear input
    setMessage("");

    // Add user's message to chat
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setLoading(true);

    try {
      // ----------------------------------------------
      // CALL YOUR EXISTING AI AGENT
      // ----------------------------------------------

      const response = await fetch("/api/agent", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Agent request failed."
        );
      }

      // ----------------------------------------------
      // ADD AI RESPONSE TO CHAT
      // ----------------------------------------------

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            data.answer ||
            "I couldn't generate an answer.",
        },
      ]);

      // ----------------------------------------------
      // IMPORTANT:
      //
      // The agent may have created a maintenance
      // request, so refresh the maintenance list.
      // ----------------------------------------------

      await loadRequests(role);
    } catch (error) {
      console.error("Agent error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            "Sorry, something went wrong while contacting the PropertyAI agent.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // FORMAT STATUS
  // --------------------------------------------------

  function formatStatus(status: string) {
    return status.replace("_", " ");
  }

  // --------------------------------------------------
  // STATUS CSS CLASS
  // --------------------------------------------------

  function getStatusClass(status: string) {
    if (status === "OPEN") {
      return "open";
    }

    if (status === "RESOLVED") {
      return "resolved";
    }

    if (status === "IN_PROGRESS") {
      return "in-progress";
    }

    return "";
  }

  // --------------------------------------------------
  // HOME PAGE
  // --------------------------------------------------

  if (!workspace) {
    return (
      <main>
        <section id="home" className="home">
          <header className="home-header">
            <button
              className="logo"
              onClick={goHome}
            >
              Property<span>AI</span>
            </button>

            <div className="switch">
              <button
                className={
                  role === "manager"
                    ? "selected"
                    : ""
                }
                onClick={() => {
  window.location.href =
    "/login?role=manager";
}}
              >
                Manager view
              </button>

              <button
                className={
                  role === "owner"
                    ? "selected"
                    : ""
                }
                onClick={() => {
  window.location.href =
    "/login?role=owner";
}}
              >
                Owner view
              </button>
            </div>
          </header>

          <div className="hero">
            <h1>
              Property management,
              <br />
              made effortless.
            </h1>

            <p>
              Welcome to PropertyAI — one calm place
              to manage maintenance, get answers, and
              keep every property moving.
            </p>

            <button
              className="primary"
              onClick={() => {
                window.location.href =
                  "/login?role=manager";
              }}
            >
              Enter manager workspace
            </button>

            <button
              className="secondary"
              onClick={() => {
                window.location.href =
                  "/login?role=owner";
              }}
            >
              I’m a property owner
            </button>
          </div>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // WORKSPACE
  // --------------------------------------------------

  return (
    <main>
      <section className="workspace">
        {/* ------------------------------------------ */}
        {/* SIDEBAR */}
        {/* ------------------------------------------ */}

        <aside>
          <button
            className="logo side-logo"
            onClick={goHome}
          >
            Property<span>AI</span>
          </button>

          <nav>
            <button
              className={
                page === "overview"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("overview")
              }
            >
              ⌂ &nbsp; Overview
            </button>

            <button
              className={
                page === "assistant"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("assistant")
              }
            >
              ✦ &nbsp; AI Assistant
            </button>
          </nav>
        </aside>

        {/* ------------------------------------------ */}
        {/* MAIN AREA */}
        {/* ------------------------------------------ */}

        <section className="workspace-main">
          {/* ---------------------------------------- */}
          {/* HEADER */}
          {/* ---------------------------------------- */}

          <header>
            <div>
              <small>
                PropertyAI /{" "}
                {role === "owner"
                  ? "Owner workspace"
                  : "Manager workspace"}
              </small>

              <h2>
                {page === "assistant"
                  ? "AI Assistant"
                  : role === "owner"
                  ? "My maintenance history"
                  : "Maintenance requests"}
              </h2>
            </div>

            <div className="switch">
              <button
                className={
                  role === "manager"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setRole("manager")
                }
              >
                Manager view
              </button>

              <button
                className={
                  role === "owner"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setRole("owner")
                }
              >
                Owner view
              </button>
            </div>
          </header>

          {/* ======================================== */}
          {/* OVERVIEW */}
          {/* ======================================== */}

          {page === "overview" && (
            <section className="content">
              <div className="intro">
                <div>
                  <h1>
                    {role === "owner"
                      ? "My maintenance requests"
                      : "Maintenance requests"}
                  </h1>

                  <p>
                    {role === "owner"
                      ? "Track the progress of requests you have reported."
                      : "Review and resolve requests across your portfolio."}
                  </p>
                </div>

                {role === "manager" && (
                  <button
                    className="primary"
                    onClick={() =>
                      setPage("assistant")
                    }
                  >
                    + New request
                  </button>
                )}
              </div>

              {/* REQUEST LIST */}

              <div className="card">
                {requests.length === 0 ? (
                  <p>
                    No maintenance requests found.
                  </p>
                ) : (
                  requests.map((request) => (
                    <article
                      className="request"
                      key={request.id}
                    >
                      {/* ICON */}

                      <div className="request-icon">
                        🔧
                      </div>

                      {/* REQUEST INFORMATION */}

                      <div>
                        <b>
                          {request.title}
                        </b>

                        <small>
                          {request.apartment
                            ?.property?.name ||
                            "Property"}{" "}
                          · Unit{" "}
                          {request.apartment?.number}
                        </small>

                        {/* Manager sees tenant */}

                        {role === "manager" &&
                          request.tenant && (
                            <small>
                              Tenant:{" "}
                              {request.tenant.name}
                            </small>
                          )}
                      </div>

                      {/* STATUS */}

                      <div>
                        <span
                          className={`state ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {formatStatus(
                            request.status
                          )}
                        </span>

                        <div className="date">
                          {new Date(
                            request.createdAt
                          ).toLocaleDateString(
                            "en-GB"
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {/* ======================================== */}
          {/* AI ASSISTANT */}
          {/* ======================================== */}

          {page === "assistant" && (
            <section className="content">
              <div className="intro">
                <div>
                  <h1>
                    Ask PropertyAI
                  </h1>

                  <p>
                    Get immediate answers about
                    your property and maintenance.
                  </p>
                </div>
              </div>

              <div className="card chat">
                <b>
                  ✦ &nbsp; PropertyAI Assistant
                </b>

                {/* CHAT MESSAGES */}

                <div className="messages">
                  {messages.map(
                    (item, index) => (
                      <div
                        key={index}
                        className={`message ${
                          item.role === "user"
                            ? "mine"
                            : ""
                        }`}
                      >
                        {item.text}
                      </div>
                    )
                  )}

                  {/* LOADING */}

                  {loading && (
                    <div className="message">
                      PropertyAI is thinking...
                    </div>
                  )}
                </div>

                {/* CHAT FORM */}

                <form
                  onSubmit={sendMessage}
                >
                  <input
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    placeholder="Ask about your property…"
                    disabled={loading}
                  />

                  <button
                    className="primary"
                    disabled={loading}
                    type="submit"
                  >
                    {loading
                      ? "..."
                      : "Send"}
                  </button>
                </form>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}