"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();

  const requestedRole =
    searchParams.get("role") === "owner"
      ? "owner"
      : "manager";

  const isOwner = requestedRole === "owner";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      role: requestedRole,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    window.location.href =
      `/?workspace=${requestedRole}`;
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">P</div>

          <div>
            <h1>PropertyAI</h1>
            <p>AI-powered property management</p>
          </div>
        </div>

        <div className="login-heading">
          <span className="login-eyebrow">
            {isOwner ? "HOME OWNER" : "PROPERTY MANAGEMENT"}
          </span>

          <h2>
            {isOwner
              ? "Owner Login"
              : "Manager Login"}
          </h2>

          <p>
            {isOwner
              ? "Sign in to access your properties and maintenance requests."
              : "Sign in to manage your properties, tenants, and maintenance requests."}
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder={
              isOwner
                ? "owner@propertyai.com"
                : "manager@propertyai.com"
            }
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          className="back-button"
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          ← Back to PropertyAI
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page" />}>
      <LoginForm />
    </Suspense>
  );
}