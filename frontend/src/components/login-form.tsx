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
        setError(body.error || "Unable to sign in.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Link href="/login" aria-label="TDMSMANAGMENT home">
          <Brand />
        </Link>
        <div className="story-content">
          <span className="eyebrow">
            <span className="status-dot" /> YOUR WORKSPACE, CONNECTED
          </span>
          <h1>
            Less managing.
            <br />
            More <span>possibility.</span>
          </h1>
          <p>
            A little clarity goes a long way. Bring your products,
            <br className="desktop-break" /> inventory, and everyday work
            together.
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
                <span>YOUR WORKSPACE</span>
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
              <span className="status-dot" /> Everything in its right place.
            </div>
          </div>
        </div>
        <div className="story-footer">
          <span>Built for a more organized day.</span>
          <span>© {new Date().getFullYear()} TDMSMANAGMENT</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-top">
          <span>Need a hand getting started?</span>
          <button onClick={() => setHelp(true)}>
            Get help <ArrowRight size={13} />
          </button>
        </div>
        <div className="login-form-wrap">
          <span className="login-icon">
            <LockKeyhole size={22} />
          </span>
          <h2>Welcome back.</h2>
          <p className="login-subtitle">Sign in to your TDMS workspace.</p>
          <form onSubmit={signIn} className="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
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
              <Label htmlFor="password">Password</Label>
              <div className="password-wrap">
                <Input
                  id="password"
                  type={visible ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={256}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
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
                  Sign in <ArrowRight />
                </>
              )}
            </Button>
          </form>
          {demo && (
            <div className="demo-login">
              <span>Just exploring?</span>
              <button
                onClick={() => {
                  setEmail("admin@tdms.local");
                  setPassword("TdmsDemo!2026");
                  setError("");
                }}
              >
                Fill demo credentials <ArrowRight size={13} />
              </button>
            </div>
          )}
          <p className="login-security">
            <ShieldCheck size={14} /> Your workspace. A secure connection.
          </p>
        </div>
        <div className="login-bottom">
          <span className="status-dot" /> All systems ready{" "}
          <span className="login-bottom-right">TDMSMANAGMENT · v1.0</span>
        </div>
      </section>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Getting into your workspace</DialogTitle>
            <DialogDescription>
              {demo
                ? "Use “Fill demo credentials” to explore this local preview, then select Sign in."
                : "Use the account configured by your workspace administrator."}{" "}
              If you need to change your credentials, ask your administrator to
              update the TDMS_LOGIN_EMAIL and TDMS_LOGIN_PASSWORD server
              settings.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setHelp(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
