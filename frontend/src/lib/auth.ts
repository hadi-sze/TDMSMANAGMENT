import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tdms_session";
export const SESSION_AGE = 60 * 60 * 8;
type Session = { email: string; expires: number };
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

export function verifyCredentials(email: string, password: string) {
  const configured = loginConfig();
  const expected = scryptSync(configured.password, "tdms-login-v1", 64);
  const actual = scryptSync(password, "tdms-login-v1", 64);
  return (
    timingSafeEqual(expected, actual) &&
    email.toLowerCase() === configured.email.toLowerCase()
  );
}

export function createSession(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, expires: Date.now() + SESSION_AGE * 1000 }),
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
    return typeof session.email === "string" &&
      typeof session.expires === "number" &&
      session.expires > Date.now()
      ? session
      : null;
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
