import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  t212Key?: string; // sealed by iron-session; never stored plaintext anywhere
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production-32chars",
  cookieName: "compoundiq_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
