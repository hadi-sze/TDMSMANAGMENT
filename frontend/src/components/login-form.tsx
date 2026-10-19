"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/joy-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "ورود انجام نشد.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Link href="/login" aria-label="صفحه اصلی TDMSMANAGMENT">
          <Brand />
        </Link>
        <div className="story-content">
          <span className="eyebrow">
            <span className="status-dot" /> فضای کاری یکپارچه شما
          </span>
          <h1>
            مدیریت ساده‌تر.
            <br />
            فرصت‌های <span>بیشتر.</span>
          </h1>
          <p>
            محصولات، موجودی و کارهای روزانه را
            <br className="desktop-break" /> در فضایی یکپارچه و منظم مدیریت
            کنید.
          </p>
          <div className="workspace-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="floating-icon float-package">
              <Package />
            </div>
            <div className="floating-icon float-shield">
              <ShieldCheck />
            </div>
            <div className="workspace-window">
              <div className="window-title">
                <span className="mini-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>فضای کاری شما</span>
                <span className="tiny-status" />
              </div>
              <div className="art-window-body">
                <div className="art-nav">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="art-content">
                  <div className="art-heading" />
                  <div className="art-cards">
                    <div />
                    <div />
                    <div />
                  </div>
                  <div className="art-row">
                    <span className="art-item-icon">
                      <Package size={14} />
                    </span>
                    <i />
                    <span className="art-check">
                      <Check size={12} />
                    </span>
                  </div>
                  <div className="art-row">
                    <span className="art-item-icon">
                      <Layers3 size={14} />
                    </span>
                    <i />
                    <span className="art-check">
                      <Check size={12} />
                    </span>
                  </div>
                  <div className="art-row">
                    <span className="art-item-icon">
                      <LockKeyhole size={14} />
                    </span>
                    <i />
                    <span className="art-check">
                      <Check size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="art-caption">
              <span className="status-dot" /> همه چیز در جای خود.
            </div>
          </div>
        </div>
        <div className="story-footer">
          <span>برای روزی منظم‌تر ساخته شده است.</span>
          <span>© {new Date().getFullYear()} TDMSMANAGMENT</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-top">
          <span>برای شروع به راهنما نیاز دارید؟</span>
          <button onClick={() => setHelp(true)}>
            دریافت راهنما <ArrowRight size={13} />
          </button>
        </div>
        <div className="login-form-wrap">
          <span className="login-icon">
            <LockKeyhole size={22} />
          </span>
          <h2>خوش آمدید.</h2>
          <p className="login-subtitle">وارد فضای کاری TDMS خود شوید.</p>
          <form onSubmit={signIn} className="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">نشانی ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="password-wrap">
                <Input
                  id="password"
                  dir="ltr"
                  type={visible ? "text" : "password"}
                  placeholder="رمز عبور را وارد کنید"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={256}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={
                    visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                  }
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <FormAlert>{error}</FormAlert>}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  ورود <ArrowRight />
                </>
              )}
            </Button>
          </form>
          {demo && (
            <div className="demo-login">
              <span>می‌خواهید محیط را امتحان کنید؟</span>
              <button
                onClick={() => {
                  setEmail("admin@tdms.local");
                  setPassword("TdmsDemo!2026");
                  setError("");
                }}
              >
                تکمیل اطلاعات ورود آزمایشی <ArrowRight size={13} />
              </button>
            </div>
          )}
          <p className="login-security">
            <ShieldCheck size={14} /> فضای کاری شما با اتصالی امن.
          </p>
        </div>
        <div className="login-bottom">
          <span className="status-dot" /> سامانه آماده است{" "}
          <span className="login-bottom-right">TDMSMANAGMENT · v1.0</span>
        </div>
      </section>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>راهنمای ورود به فضای کاری</DialogTitle>
            <DialogDescription>
              {demo
                ? "برای آزمایش محیط، «تکمیل اطلاعات ورود آزمایشی» و سپس «ورود» را انتخاب کنید."
                : "از حسابی استفاده کنید که مدیر فضای کاری تنظیم کرده است."}{" "}
              برای تغییر اطلاعات ورود، از مدیر بخواهید تنظیمات TDMS_LOGIN_EMAIL
              و TDMS_LOGIN_PASSWORD را در سرور به‌روزرسانی کند.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setHelp(false)}>
            متوجه شدم
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
