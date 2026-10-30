import { getIronSession, unsealData, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  agentId?: string;
  role?: "AGENT" | "ADMIN";
};

export const SESSION_COOKIE = "cashewtrace_session";
const TTL_SECONDS = 60 * 60 * 12; // 12 hours: one working day at the hub

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return {
    password,
    cookieName: SESSION_COOKIE,
    ttl: TTL_SECONDS,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/** Decrypt a raw cookie value without touching next/headers - used by proxy.ts. */
export async function readSessionCookie(value: string | undefined): Promise<SessionData> {
  if (!value) return {};
  const { password, ttl } = sessionOptions();
  try {
    return await unsealData<SessionData>(value, { password, ttl });
  } catch {
    return {};
  }
}
