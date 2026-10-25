import "server-only";
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tdms_session";
export const SESSION_AGE = 60 * 60 * 8;
type Session = { email: string; expires: number; stamp: string };
const runtime = globalThis as typeof globalThis & {
  tdmsDevelopmentSecret?: string;
};
const developmentSecret = (runtime.tdmsDevelopmentSecret ??=
  randomBytes(48).toString("hex"));

function secret() {
  const value = process.env.TDMS_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32))
    throw new Error(
      "Set TDMS_SESSION_SECRET to at least 32 random characters.",
    );
  return value || developmentSecret;
}

export function loginConfig() {
  const email = process.env.TDMS_LOGIN_EMAIL || "admin@tdms.local";
  const password = process.env.TDMS_LOGIN_PASSWORD || "TdmsDemo!2026";
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.TDMS_LOGIN_PASSWORD || password === "TdmsDemo!2026")
  )
    throw new Error(
      "Set a unique TDMS_LOGIN_PASSWORD before running in production.",
    );
  return { email, password };
}

export async function accountRequest(action: string, body: unknown) {
  const base = process.env.TDMS_API_BASE_URL || "http://127.0.0.1:5043";
  return fetch(`${base.replace(/\/$/, "")}/api/account/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

export function createSession(email: string, stamp: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, stamp, expires: Date.now() + SESSION_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Session;
    if (typeof session.email !== "string" || typeof session.stamp !== "string" ||
        typeof session.expires !== "number" || session.expires <= Date.now()) return null;
    const response = await accountRequest("validate-session", { email: session.email, stamp: session.stamp });
    return response.ok ? session : null;
  } catch {
    return null;
  }
}

export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") || "");
    // Next.js can normalize the internal request URL to localhost. Validate
    // against the actual Host header sent by the browser instead.
    return (
      ["http:", "https:"].includes(origin.protocol) &&
      origin.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
