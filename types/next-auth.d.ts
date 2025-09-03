// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // Añadido el rol aquí también
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string; // Añadido el rol aquí
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string; // Añadido el id al token
    role: string; // Añadido el rol al token
  }
}