"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

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
  return <Card component="section" sx={{ mt: 3, p: { xs: 2, sm: 3 } }} aria-labelledby="password-heading">
    <Typography component="h2" variant="h6" id="password-heading">تغییر رمز عبور</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ my: 2, lineHeight: 2 }}>رمز جدید باید حداقل ۱۲ نویسه باشد. پس از تغییر رمز، همه نشست‌ها پایان می‌یابد و باید دوباره وارد شوید.</Typography>
    {success ? <div>
      <Alert severity="success" role="status">رمز عبور با موفقیت تغییر کرد.</Alert>
      <Button sx={{ mt: 2 }} onClick={() => { router.replace("/login"); router.refresh(); }}>ورود با رمز جدید</Button>
    </div> : <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      {([
        ["currentPassword", "رمز عبور فعلی", "current-password"],
        ["newPassword", "رمز عبور جدید", "new-password"],
        ["confirmPassword", "تکرار رمز عبور جدید", "new-password"],
      ] as const).map(([name, label, autoComplete]) => <TextField key={name} required fullWidth id={name} label={label}
        name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} disabled={pending}
        helperText={name === "newPassword" ? "۱۲ تا ۲۵۶ نویسه، متفاوت از رمز فعلی" : undefined}
        slotProps={{ htmlInput: { dir: "ltr", minLength: name === "currentPassword" ? 1 : 12, maxLength: 256 } }} />)}
      <FormControlLabel control={<Checkbox checked={visible} disabled={pending} onChange={e => setVisible(e.target.checked)} />} label="نمایش رمزها" />
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      <Button type="submit" variant="contained" loading={pending}>ذخیره رمز جدید</Button>
    </form>}
  </Card>;
}

