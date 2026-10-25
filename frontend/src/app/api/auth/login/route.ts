import { NextResponse } from "next/server";
import {
  createSession,
  sameOrigin,
  SESSION_AGE,
  SESSION_COOKIE,
  accountRequest,
} from "@/lib/auth";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  if (attempts.size > 1000)
    for (const [key, value] of attempts)
      if (value.reset < now) attempts.delete(key);
  const previous = attempts.get(ip);
  const bucket =
    previous && previous.reset > now
      ? previous
      : { count: 0, reset: now + 15 * 60 * 1000 };
  if (bucket.count >= 10)
    return NextResponse.json(
      { error: "Too many attempts. Please try again in 15 minutes." },
      { status: 429 },
    );
  try {
    const { email, password, persistent } = await request.json();
    bucket.count++;
    attempts.set(ip, bucket);
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 || password.length === 0 || password.length > 256
    ) {
      return NextResponse.json(
        { error: "The email or password is incorrect." },
        { status: 401 },
      );
    }
    const verification = await accountRequest("verify", { email: email.trim(), password });
    if (!verification.ok) return NextResponse.json(
      { error: "Sign-in failed." },
      { status: verification.status === 429 ? 429 : verification.status === 401 || verification.status === 400 ? 401 : 503 },
    );
    const { stamp } = await verification.json();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      createSession(email.trim().toLowerCase(), stamp),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(persistent === false ? {} : { maxAge: SESSION_AGE }),
      },
    );
    attempts.delete(ip);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Sign-in is unavailable. Check the server configuration." },
      { status: 503 },
    );
  }
}
