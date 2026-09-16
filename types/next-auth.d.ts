import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "MANAGER" | "OWNER";
    };
  }

  interface User {
    role: "MANAGER" | "OWNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "MANAGER" | "OWNER";
  }
}
