"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createTheme, ThemeProvider, THEME_ID, useColorScheme } from "@mui/material/styles";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

declare module "@mui/material/styles" {
  interface CssThemeVariables { enabled: true }
}

const theme = createTheme({
  direction: "rtl",
  cssVariables: { cssVarPrefix: "tdms-material-login", colorSchemeSelector: '[data-login-scheme="%s"]' },
  colorSchemes: {
    light: { palette: { primary: { main: "#b9410d" }, background: { default: "#f4f6fa", paper: "#ffffff" }, text: { primary: "#192738", secondary: "#536378" } } },
    dark: { palette: { primary: { main: "#ffad7d" }, background: { default: "#0d1522", paper: "#172231" }, text: { primary: "#f0f4fa", secondary: "#b3bfd0" } } },
  },
  typography: { fontFamily: '"Yekan", Arial, sans-serif', button: { textTransform: "none", fontWeight: 600 }, h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.6 } },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 44 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiTextField: { defaultProps: { fullWidth: true, variant: "outlined" } },
    MuiButtonBase: { styleOverrides: { root: { "&.Mui-focusVisible": { outline: "3px solid currentColor", outlineOffset: 3 } } } },
  },
});

function ModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const reduced = useReducedMotion();
  const dark = mode === "dark" || (mode === "system" && systemMode === "dark");
  return <IconButton disabled={!mode} aria-label={dark ? "فعال کردن حالت روشن" : "فعال کردن حالت تاریک"} aria-pressed={dark}
    onClick={() => setMode(dark ? "light" : "dark")} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
    <motion.span key={dark ? "dark" : "light"} initial={{ opacity: 0, rotate: reduced ? 0 : -45 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} style={{ display: "flex" }}>
      {dark ? <LightModeRounded /> : <DarkModeRounded />}
    </motion.span>
  </IconButton>;
}

function LoginContent() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [visible, setVisible] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [help, setHelp] = React.useState(false);
  const submitting = React.useRef(false);
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), persistent: data.get("persistent") === "on" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "ایمیل یا رمز عبور اشتباه است." : response.status === 429 ? "تعداد تلاش‌ها بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید." : "ورود انجام نشد؛ دوباره تلاش کنید.");
        return;
      }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید."); }
    finally { submitting.current = false; setPending(false); }
  }
  return <ScopedCssBaseline enableColorScheme sx={(t) => ({
    minHeight: "100dvh", position: "relative", overflow: "hidden", bgcolor: "background.default", color: "text.primary",
    backgroundImage: "radial-gradient(ellipse at 95% 15%, rgba(237,91,32,.12), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(34,83,159,.12), transparent 60%)",
    "& .MuiPaper-root, & .MuiOutlinedInput-root, & .MuiButton-root, & .MuiIconButton-root": { transition: t.transitions.create(["background-color", "border-color", "box-shadow"], { duration: 220 }) },
    "@media (prefers-reduced-motion: reduce)": { "& *, & *::before, & *::after": { transition: "none !important", animation: "none !important" } },
  })}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, minHeight: "100dvh" }}>
      <Box sx={{ display: "flex", flexDirection: "column", px: { xs: 2, sm: 5, lg: 8 }, py: { xs: 2, sm: 3 }, zIndex: 1 }}>
        <Stack component="header" direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <Image src="/branding/nioc-login-logo.png" alt="شرکت ملی نفت ایران" width={48} height={54} priority style={{ objectFit: "contain", background: "#fff", borderRadius: 10, padding: 4 }} />
            <Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>فضای کاری TDMS</Typography><Typography component="span" variant="caption" dir="ltr" color="text.secondary">TDMSMANAGMENT</Typography></Box>
          </Stack>
          <ModeToggle />
        </Stack>
        <Box component="main" sx={{ display: "flex", alignItems: "center", flex: 1, py: { xs: 4, md: 6 } }}>
          <motion.div initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.4 }} style={{ width: "100%", maxWidth: 460, marginInline: "auto" }}>
            <Paper elevation={0} sx={(t) => ({
              p: { xs: 2.5, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3,
              backgroundColor: "rgba(255,255,255,.72)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 16px 56px rgba(25,39,56,.06)",
              ...t.applyStyles("dark", { backgroundColor: "rgba(23,34,49,.78)", boxShadow: "0 16px 56px rgba(0,0,0,.2)" }),
            })}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 0 }}>به فضای کاری خود خوش آمدید</Typography>
              <Typography component="h1" variant="h1" sx={{ mt: 1 }}>ورود به سامانه</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1, mb: 3, lineHeight: 2 }}>برای ادامه، اطلاعات حساب کاربری خود را وارد کنید.</Typography>
              <Box component="form" onSubmit={signIn} aria-busy={pending} sx={{ display: "grid", gap: 2.5 }}>
                <TextField id="login-email" name="email" label="نشانی ایمیل" type="email" required autoComplete="username" disabled={pending}
                  slotProps={{ htmlInput: { dir: "ltr", maxLength: 254, autoCapitalize: "none", spellCheck: false } }} />
                <TextField id="login-password" name="password" label="رمز عبور" type={visible ? "text" : "password"} required autoComplete="current-password" disabled={pending}
                  slotProps={{ htmlInput: { dir: "ltr", maxLength: 256 }, input: { endAdornment: <InputAdornment position="end">
                    <IconButton type="button" edge="end" disabled={pending} aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"} aria-pressed={visible} onMouseDown={e => e.preventDefault()} onClick={() => setVisible(!visible)}>
                      {visible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment> } }} />
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.5 }}>
                  <FormControlLabel sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 13 } }} control={<Checkbox name="persistent" disabled={pending} size="small" />} label="مرا به خاطر بسپار" />
                  <Button type="button" size="small" onClick={() => setHelp(true)}>فراموشی رمز عبور</Button>
                </Stack>
                <AnimatePresence initial={false}>{error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} style={{ overflow: "hidden" }}>
                  <Alert severity="error" role="alert">{error}</Alert>
                </motion.div>}</AnimatePresence>
                <Button type="submit" variant="contained" size="large" fullWidth loading={pending} endIcon={<ArrowBackRounded />} sx={{ minHeight: 48 }}>ورود به حساب</Button>
              </Box>
              <Divider sx={{ my: 3 }} />
              <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">حساب کاربری ندارید؟</Typography>
                <Button size="small" onClick={() => setHelp(!help)} aria-expanded={help} aria-controls="login-help">راهنمای دریافت حساب</Button>
              </Stack>
              <AnimatePresence initial={false}>{help && <motion.div id="login-help" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} style={{ overflow: "hidden" }}>
                <Alert severity="info" sx={{ mt: 2 }} role="status">برای دریافت حساب یا بازیابی رمز عبور با مدیر سامانه تماس بگیرید.</Alert>
              </motion.div>}</AnimatePresence>
            </Paper>
          </motion.div>
        </Box>
        <Typography component="footer" variant="caption" color="text.secondary" sx={{ textAlign: "center" }}><bdi>© {new Date().getFullYear()} TDMSMANAGMENT</bdi></Typography>
      </Box>
      <Box component="aside" aria-label="درباره فضای کاری" sx={{ display: { xs: "none", md: "flex" }, position: "relative", flexDirection: "column", justifyContent: "flex-end", m: 2, borderRadius: 4, overflow: "hidden", bgcolor: "#152b44", color: "#fff", minHeight: 600,
        backgroundImage: "linear-gradient(180deg, rgba(9,24,43,.12), rgba(9,24,43,.92)), url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)", backgroundSize: "cover", backgroundPosition: "center" }}>
        <Box sx={{ p: { md: 4, lg: 6 }, maxWidth: 560 }}>
          <Typography variant="overline" sx={{ letterSpacing: 2, opacity: .8 }} dir="ltr">TDMS WORKSPACE</Typography>
          <Typography component="h2" sx={{ fontSize: { md: 30, lg: 40 }, lineHeight: 1.7, fontWeight: 700, mt: 2, mb: 2 }}>فضای کاری شما،<br />منظم و یکپارچه.</Typography>
          <Typography sx={{ color: "#d5deeb", lineHeight: 2.2 }}>مدیریت اطلاعات شرکت‌ها، محصولات و داده‌های سازمان در یک فضای مشترک.</Typography>
          <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,.2)" }} />
          <Typography variant="body2" sx={{ color: "#d5deeb" }}>سامانه مدیریت اطلاعات شرکت ملی نفت ایران</Typography>
        </Box>
      </Box>
    </Box>
  </ScopedCssBaseline>;
}

export function LoginForm() {
  const [schemeNode, setSchemeNode] = React.useState<HTMLDivElement | null>(null);
  return <div id="tdms-material-login" ref={setSchemeNode} dir="rtl" suppressHydrationWarning>
    <InitColorSchemeScript attribute="data-login-scheme" defaultMode="light" modeStorageKey="tdms-login-mode" colorSchemeStorageKey="tdms-login-scheme" colorSchemeNode="document.getElementById('tdms-material-login')" />
    <ThemeProvider theme={{ [THEME_ID]: theme }} colorSchemeNode={schemeNode} defaultMode="light" modeStorageKey="tdms-login-mode" colorSchemeStorageKey="tdms-login-scheme" disableNestedContext>
      <LoginContent />
    </ThemeProvider>
  </div>;
}
