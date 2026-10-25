"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Alert from "@mui/joy/Alert";

export function ChangePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || success) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    if (data.get("newPassword") !== data.get("confirmPassword")) { setError("رمز جدید و تکرار آن یکسان نیستند."); return; }
    if (data.get("newPassword") === data.get("currentPassword")) { setError("رمز جدید باید با رمز فعلی متفاوت باشد."); return; }
    setPending(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "تغییر رمز انجام نشد."); return; }
      form.reset(); setSuccess(true);
    } catch { setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید."); }
    finally { setPending(false); }
  }
  return <section className="settings-panel" style={{ marginTop: 24, padding: 24 }} aria-labelledby="password-heading">
    <h2 id="password-heading">تغییر رمز عبور</h2>
    <p style={{ marginBlock: 12 }}>رمز جدید باید حداقل ۱۲ نویسه باشد. پس از تغییر رمز، همه نشست‌ها پایان می‌یابد و باید دوباره وارد شوید.</p>
    {success ? <div>
      <Alert color="success" role="status">رمز عبور با موفقیت تغییر کرد.</Alert>
      <Button sx={{ mt: 2 }} onClick={() => { router.replace("/login"); router.refresh(); }}>ورود با رمز جدید</Button>
    </div> : <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      {([
        ["currentPassword", "رمز عبور فعلی", "current-password"],
        ["newPassword", "رمز عبور جدید", "new-password"],
        ["confirmPassword", "تکرار رمز عبور جدید", "new-password"],
      ] as const).map(([name, label, autoComplete]) => <FormControl key={name} required>
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <Input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} disabled={pending}
          slotProps={{ input: { id: name, dir: "ltr", minLength: name === "currentPassword" ? 1 : 12, maxLength: 256 } }} />
      </FormControl>)}
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={visible} disabled={pending} onChange={e => setVisible(e.target.checked)} />نمایش رمزها</label>
      {error && <Alert color="danger" role="alert">{error}</Alert>}
      <Button type="submit" loading={pending}>ذخیره رمز جدید</Button>
    </form>}
  </section>;
}
