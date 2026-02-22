import "next-auth";
import "next-auth/jwt";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }

  interface User {
    id: string;
    role: Role;
    emailVerified: boolean;
    phoneVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    emailVerified: boolean;
    phoneVerified: boolean;
  }
}
