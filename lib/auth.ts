import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { prisma } from "@/app/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export type AuthUser = {
  id: string;
  username: string;
  role?: string;
};

export type CurrentUser = {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean | null;
  branch_id: string | null;
  site_id: string | null;
  center_id: string | null;
  is_super_admin: boolean;
};

export function createToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role || "user",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function getCurrentUserRecord(): Promise<CurrentUser | null> {
  const tokenUser = await getCurrentUser();

  if (!tokenUser?.id) {
    return null;
  }

  const rows = await prisma.$queryRaw<CurrentUser[]>`
    select
      id,
      username,
      full_name,
      email,
      is_active,
      branch_id,
      site_id,
      center_id,
      coalesce(is_super_admin, false) as is_super_admin
    from users
    where id = ${tokenUser.id}::uuid
      and is_active = true
    limit 1
  `;

  return rows[0] || null;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUserRecord();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
