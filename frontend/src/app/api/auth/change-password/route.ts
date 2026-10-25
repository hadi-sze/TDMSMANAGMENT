import { NextResponse } from "next/server";
import { accountRequest, getSession, sameOrigin, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "دوباره وارد حساب شوید." }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 }); }
  const { currentPassword, newPassword, confirmPassword } = body ?? {};
  if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 256 ||
      typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 256 ||
      !newPassword.trim() || newPassword !== confirmPassword || newPassword === currentPassword)
    return NextResponse.json({ error: "رمز جدید باید ۱۲ تا ۲۵۶ نویسه، متفاوت از رمز فعلی و با تکرار آن یکسان باشد." }, { status: 400 });
  try {
    const result = await accountRequest("change-password", { email: session.email, currentPassword, newPassword });
    if (!result.ok) return NextResponse.json({ error: result.status === 401 ? "رمز عبور فعلی صحیح نیست." :
      result.status === 429 ? "تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه دیگر تلاش کنید." : "تغییر رمز انجام نشد؛ دوباره تلاش کنید." },
      { status: [400, 401, 409, 429].includes(result.status) ? result.status : 503 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "ارتباط با سرور قطع شد؛ اگر رمز تغییر کرده باشد، با رمز جدید وارد شوید." }, { status: 503 });
  }
}
