import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

export function createToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role || "admin",
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

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}