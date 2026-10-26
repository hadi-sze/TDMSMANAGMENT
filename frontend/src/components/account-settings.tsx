"use client";

import { useState, type ReactNode } from "react";
import { createTheme, ThemeProvider, THEME_ID } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import PersonOutline from "@mui/icons-material/PersonOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import { ChangePasswordForm } from "@/components/change-password-form";

const settingsTheme = createTheme({
  cssVariables: false,
  direction: "rtl",
  palette: { mode: "light", primary: { main: "#b9410d" }, background: { paper: "#fff" }, text: { primary: "#192738", secondary: "#58677b" }, divider: "#e4e8ef" },
  typography: { fontFamily: '"Yekan", Arial, sans-serif', button: { textTransform: "none", fontWeight: 600 }, h5: { fontWeight: 700 }, h6: { fontSize: 18, fontWeight: 700 } },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { defaultProps: { variant: "outlined" }, styleOverrides: { root: { boxShadow: "0 4px 20px rgba(25,39,56,.025)" } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 42 } } },
    MuiButtonBase: { styleOverrides: { root: { "&.Mui-focusVisible": { outline: "2px solid currentColor", outlineOffset: 2 } } } },
  },
});

function Details({ rows }: { rows: [string, ReactNode][] }) {
  return <Box component="dl" sx={{ m: 0, display: "grid", gap: 0 }}>
    {rows.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "150px minmax(0, 1fr)" }, gap: 1, py: 2, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>)}
  </Box>;
}

export function AccountSettings({ email, mode, onHelp, onLogout }: {
  email: string; mode: "demo" | "api"; onHelp: (kind: "support" | "guide") => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState(0);
  return <ThemeProvider theme={{ [THEME_ID]: settingsTheme }}>
    <Box component="section" className="workspace-page" dir="rtl" sx={{ color: "text.primary" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>فضای کاری شما</Typography>
        <Typography component="h1" variant="h5" sx={{ mt: 0.5, mb: 1 }}>تنظیمات حساب کاربری</Typography>
        <Typography variant="body2" color="text.secondary">اطلاعات حساب، رمز عبور و وضعیت نشست خود را مدیریت کنید.</Typography>
      </Box>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="بخش‌های تنظیمات حساب" variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tab id="settings-tab-account" aria-controls="settings-panel-account" label="حساب کاربری" icon={<PersonOutline />} iconPosition="start" />
        <Tab id="settings-tab-security" aria-controls="settings-panel-security" label="امنیت و اتصال" icon={<ShieldOutlined />} iconPosition="start" />
      </Tabs>
      <Box role="tabpanel" hidden={tab !== 0} id="settings-panel-account" aria-labelledby="settings-tab-account">
        <Card><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Avatar sx={{ bgcolor: "#fff0e7", color: "primary.main", width: 52, height: 52 }}><PersonOutline /></Avatar>
            <Box sx={{ flex: 1, minWidth: 150 }}><Typography component="h2" variant="h6">مدیر فضای کاری</Typography><Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}><bdi>{email}</bdi></Typography></Box>
            <Chip label="مدیر" color="primary" variant="outlined" size="small" />
          </Stack>
          <Divider />
          <Details rows={[["نام فضای کاری", "فضای کاری TDMS"], ["برنامه", <bdi key="app">TDMSMANAGMENT</bdi>], ["ایمیل حساب کاربری", <bdi key="email">{email}</bdi>], ["حالت فضای کاری", mode === "demo" ? "فضای کاری آزمایشی محلی" : "فضای کاری متصل به سرویس"]]} />
          <Button variant="text" onClick={() => onHelp("support")}>دریافت راهنما</Button>
        </CardContent></Card>
        <ChangePasswordForm />
      </Box>
      <Box role="tabpanel" hidden={tab !== 1} id="settings-panel-security" aria-labelledby="settings-tab-security">
        <Card><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 2 }}><ShieldOutlined color="primary" /><Typography component="h2" variant="h6">دسترسی و اتصال</Typography></Stack>
          <Details rows={[["نشست کاربری", "وارد شده · اعتبار نشست: ۸ ساعت"], ["امنیت نشست", "کوکی نشست امضاشده با دسترسی محدود به سرور"], ["منبع داده", mode === "demo" ? "ذخیره‌سازی محلی داده‌های آزمایشی" : "سرویس دات‌نت"], ["دسترسی به سرویس", "اتصال از طریق سرور سامانه"], ["مدیریت اتصال", "تنظیمات اتصال توسط مدیر سامانه مدیریت می‌شود."]]} />
          <Button onClick={() => onHelp("guide")}>راهنمای اتصال</Button>
        </CardContent></Card>
      </Box>
      <Card sx={{ mt: 3 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2 }}>
          <Box><Typography component="h2" variant="h6">خروج از حساب</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>برای پایان دادن به نشست در این دستگاه، خارج شوید.</Typography></Box>
          <Button variant="outlined" color="error" startIcon={<LogoutRounded />} onClick={onLogout} sx={{ flexShrink: 0 }}>خروج از حساب</Button>
        </Stack>
      </CardContent></Card>
    </Box>
  </ThemeProvider>;
}

