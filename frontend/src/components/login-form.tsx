"use client";
import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CssVarsProvider, extendTheme, useColorScheme } from "@mui/joy/styles";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Checkbox from "@mui/joy/Checkbox";
import Divider from "@mui/joy/Divider";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton, { IconButtonProps } from "@mui/joy/IconButton";
import Link from "@mui/joy/Link";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Image from "next/image";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import Alert from "@mui/joy/Alert";
import { useRouter } from "next/navigation";

const MotionBox = motion.create(Box);

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  password: HTMLInputElement;
  persistent: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

function ColorSchemeToggle(props: IconButtonProps) {
  const { onClick, ...other } = props;
  const reduced = useReducedMotion();
  const { mode, systemMode, setMode } = useColorScheme();
  const dark = mode === "dark" || (mode === "system" && systemMode === "dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <IconButton
      aria-label={
        mounted && dark ? "فعال کردن حالت روشن" : "فعال کردن حالت تاریک"
      }
      aria-pressed={mounted && dark}
      sx={{ alignSelf: "center", width: 40, height: 40 }}
      size="sm"
      variant="outlined"
      disabled={!mounted}
      onClick={(event) => {
        setMode(dark ? "light" : "dark");
        onClick?.(event);
      }}
      {...other}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={mounted && dark ? "dark" : "light"}
          initial={{
            opacity: 0,
            rotate: reduced ? 0 : -60,
            scale: reduced ? 1 : 0.8,
          }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{
            opacity: 0,
            rotate: reduced ? 0 : 60,
            scale: reduced ? 1 : 0.8,
          }}
          transition={{ duration: reduced ? 0 : 0.16 }}
          style={{ display: "flex" }}
        >
          {mounted && dark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}

const customTheme = extendTheme({
  cssVarPrefix: "tdms-login",
  direction: "rtl",
  fontFamily: {
    body: '"Yekan", Arial, sans-serif',
    display: '"Yekan", Arial, sans-serif',
  },
});

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const entrance = {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.35 },
  };
  const [schemeNode, setSchemeNode] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [visible, setVisible] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [help, setHelp] = React.useState(false);
  const formRef = React.useRef<SignInFormElement>(null);
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = event.currentTarget.elements as FormElements;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.email.value,
          password: fields.password.value,
          persistent: fields.persistent.checked,
        }),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "ایمیل یا رمز عبور اشتباه است."
            : response.status === 429
              ? "تعداد تلاش‌ها بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید."
              : "ورود انجام نشد؛ دوباره تلاش کنید.",
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div ref={setSchemeNode} className="joy-login-root">
      <CssVarsProvider
        disableNestedContext
        colorSchemeNode={schemeNode}
        modeStorageKey="tdms-login-mode"
        theme={customTheme}
        defaultMode="light"
      >
        <GlobalStyles
          styles={{
            ".joy-login-root": {
              minHeight: "100dvh",
              backgroundColor:
                "var(--tdms-login-palette-background-body, #fff)",
              color: "var(--tdms-login-palette-text-primary, #171a1c)",
              colorScheme: "light",
              "--Transition-duration": "0.4s",
              transition:
                "background-color var(--Transition-duration), color var(--Transition-duration)",
            },
            '.joy-login-root[data-joy-color-scheme="dark"]': {
              colorScheme: "dark",
            },
            ".joy-login-root .MuiButton-root, .joy-login-root .MuiIconButton-root, .joy-login-root .MuiInput-root, .joy-login-root .MuiLink-root":
              {
                transition:
                  "background-color var(--Transition-duration), color var(--Transition-duration), border-color var(--Transition-duration), box-shadow var(--Transition-duration), transform 160ms ease",
              },
            "@media (hover: hover) and (prefers-reduced-motion: no-preference)":
              {
                ".joy-login-root .MuiButton-root:not(:disabled):hover": {
                  transform: "translateY(-2px)",
                },
                ".joy-login-root .MuiButton-root:not(:disabled):active": {
                  transform: "translateY(0) scale(0.98)",
                },
              },
            "@media (prefers-reduced-motion: reduce)": {
              ".joy-login-root": { "--Transition-duration": "0s" },
            },
          }}
        />
        <Box
          sx={(theme) => ({
            width: { xs: "100%", md: "50vw" },
            transition:
              "width var(--Transition-duration), background-color var(--Transition-duration), color var(--Transition-duration)",

            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "flex-end",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(255 255 255 / 0.2)",
            color: "text.primary",
            [theme.getColorSchemeSelector("dark")]: {
              backgroundColor: "rgba(19 19 24 / 0.4)",
            },
          })}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100dvh",
              width: "100%",
              px: { xs: 3, sm: 5 },
            }}
          >
            <MotionBox
              {...entrance}
              component="header"
              sx={{
                py: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ gap: 2, display: "flex", alignItems: "center" }}>
                <Image
                  src="/branding/nioc-login-logo.png"
                  alt="شرکت ملی نفت ایران"
                  width={60}
                  height={66}
                  priority
                  style={{
                    objectFit: "contain",
                    flexShrink: 0,
                    background: "#fff",
                    borderRadius: 12,
                    padding: 6,
                  }}
                />
                <Typography
                  level="title-lg"
                  sx={{ fontSize: { xs: 14, sm: 18 } }}
                >
                  TDMSMANAGMENT
                </Typography>
              </Box>
              <ColorSchemeToggle />
            </MotionBox>
            <MotionBox
              {...entrance}
              transition={{
                duration: reduced ? 0 : 0.4,
                delay: reduced ? 0 : 0.08,
              }}
              component="main"
              sx={{
                my: "auto",
                py: 2,
                pb: 5,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: 400,
                maxWidth: "100%",
                mx: "auto",
                borderRadius: "sm",
                "& form": {
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                },
                [`& .MuiFormLabel-asterisk`]: {
                  visibility: "hidden",
                },
              }}
            >
              <Stack sx={{ gap: 4, mb: 2 }}>
                <Stack sx={{ gap: 1 }}>
                  <Typography component="h1" level="h3">
                    ورود
                  </Typography>
                  <Typography level="body-sm">
                    حساب کاربری ندارید؟{" "}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setHelp(true)}
                      level="title-sm"
                    >
                      راهنمای دریافت حساب
                    </Link>
                  </Typography>
                </Stack>
                <Button
                  variant="soft"
                  color="neutral"
                  fullWidth
                  disabled
                  startDecorator={<GoogleIcon />}
                >
                  ورود با گوگل (به‌زودی)
                </Button>
              </Stack>
              <Divider sx={{ color: "text.tertiary" }}>ورود با ایمیل</Divider>
              <AnimatePresence initial={false}>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <Alert color="danger" role="alert">
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {help && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <Alert color="neutral">
                      برای دریافت حساب یا بازیابی رمز عبور با مدیر سامانه تماس
                      بگیرید.
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              <Stack sx={{ gap: 4, mt: 2 }}>
                <form ref={formRef} onSubmit={signIn}>
                  <FormControl required>
                    <FormLabel>نشانی ایمیل</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      autoComplete="username"
                      slotProps={{ input: { dir: "ltr", maxLength: 254 } }}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormControl required>
                    <FormLabel>رمز عبور</FormLabel>
                    <Input
                      type={visible ? "text" : "password"}
                      endDecorator={
                        <IconButton
                          type="button"
                          variant="plain"
                          disabled={pending}
                          aria-label={
                            visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                          }
                          aria-pressed={visible}
                          onClick={() => setVisible(!visible)}
                        >
                          {visible ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      }
                      name="password"
                      autoComplete="current-password"
                      slotProps={{ input: { dir: "ltr", maxLength: 256 } }}
                      disabled={pending}
                    />
                  </FormControl>
                  <Stack sx={{ gap: 4, mt: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      <Checkbox
                        size="sm"
                        label="مرا به خاطر بسپار"
                        name="persistent"
                        disabled={pending}
                      />
                      <Link
                        level="title-sm"
                        component="button"
                        type="button"
                        onClick={() => setHelp(true)}
                      >
                        رمز عبور را فراموش کرده‌اید؟
                      </Link>
                    </Box>
                    <Button type="submit" fullWidth loading={pending}>
                      ورود
                    </Button>
                  </Stack>
                </form>
                {demo && (
                  <Button
                    variant="plain"
                    disabled={pending}
                    onClick={() => {
                      if (formRef.current) {
                        formRef.current.elements.email.value =
                          "admin@tdms.local";
                        formRef.current.elements.password.value =
                          "TdmsDemo!2026";
                      }
                    }}
                  >
                    تکمیل اطلاعات ورود آزمایشی
                  </Button>
                )}
              </Stack>
            </MotionBox>
            <Box component="footer" sx={{ py: 3 }}>
              <Typography level="body-xs" sx={{ textAlign: "center" }}>
                © TDMSMANAGMENT {new Date().getFullYear()}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box
          sx={(theme) => ({
            display: { xs: "none", md: "block" },
            height: "100%",
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            left: { xs: 0, md: "50vw" },
            overflow: "hidden",
            pointerEvents: "none",
            transition:
              "left var(--Transition-duration), right var(--Transition-duration), background-color var(--Transition-duration)",
            backgroundColor: "background.level1",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "opacity var(--Transition-duration) ease-in-out",
            },
            "&::before": {
              backgroundImage:
                "url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)",
            },
            "&::after": {
              opacity: 0,
              backgroundImage:
                "url(https://images.unsplash.com/photo-1572072393749-3ca9c8ea0831?auto=format&w=1000&dpr=2)",
            },
            [theme.getColorSchemeSelector("dark")]: {
              "&::after": { opacity: 1 },
            },
          })}
        />
      </CssVarsProvider>
    </div>
  );
}
