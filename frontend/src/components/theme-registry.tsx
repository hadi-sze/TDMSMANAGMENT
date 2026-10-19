"use client";

import { useState, type ReactNode } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { prefixer } from "stylis";
import { useServerInsertedHTML } from "next/navigation";

const fontFamily = '"Yekan", "B Yekan", Arial, Helvetica, sans-serif';
const theme = extendTheme({
  direction: "rtl",
  fontFamily: { body: fontFamily, display: fontFamily },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: "#fff4ed",
          100: "#ffe4d2",
          200: "#ffc6a3",
          300: "#ffa16b",
          400: "#fa7b3b",
          500: "#ed5b20",
          600: "#cf4514",
          700: "#a93413",
          800: "#872d17",
          900: "#6e2816",
        },
      },
    },
  },
  components: {
    JoySelect: {
      defaultProps: { size: "sm", variant: "outlined" },
      styleOverrides: { root: { fontSize: 14, borderRadius: 8 } },
    },
    JoyTable: {
      styleOverrides: {
        root: {
          tableLayout: "auto",
          fontSize: 14,
          "--TableCell-paddingX": "18px",
          "--TableCell-paddingY": "14px",
          "& thead th": {
            textAlign: "start",
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: "#fbfbfc",
            color: "#777a80",
            height: "auto",
          },
          "& tbody td": { textAlign: "start" },
        },
      },
    },
    JoyChip: { defaultProps: { size: "sm", variant: "soft" } },
  },
});

// Flush Emotion rules into each server render before the corresponding content.
export function ThemeRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: "tdms-joy-rtl",
      prepend: true,
      stylisPlugins: [prefixer, rtlPlugin],
    });
    cache.compat = true;
    const previousInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined)
        inserted.push(serialized.name);
      return previousInsert(...args);
    };
    return {
      cache,
      flush: () => {
        const names = inserted;
        inserted = [];
        return names;
      },
    };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (!names.length) return null;
    const styles = names
      .map((name) => cache.inserted[name])
      .filter((rule) => typeof rule === "string")
      .join("");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <CssVarsProvider
        theme={theme}
        defaultMode="light"
        modeStorageKey="tdms-joy-mode"
        disableTransitionOnChange
      >
        {children}
      </CssVarsProvider>
    </CacheProvider>
  );
}
