"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: "/",
        })
      }
      style={{
        marginTop: "20px",
        padding: "10px 18px",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}