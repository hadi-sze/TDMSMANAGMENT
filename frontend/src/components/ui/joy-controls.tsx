"use client";

import type { ReactNode } from "react";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Alert from "@mui/joy/Alert";
import { AlertCircle } from "lucide-react";

export function FilterSelect({
  label,
  id,
  placeholder,
  disablePortal = false,
  value,
  onValueChange,
  options,
}: {
  label: string;
  id?: string;
  placeholder?: string;
  disablePortal?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      className="animated-filter-select"
      id={id}
      placeholder={placeholder}
      aria-label={label}
      value={value || null}
      onChange={(_, next) => {
        if (next !== null) onValueChange(next);
      }}
      slotProps={{
        listbox: {
          className: "animated-filter-listbox",
          dir: "rtl",
          disablePortal,
          sx: { zIndex: 1300, fontSize: 14, maxHeight: 240 },
        },
      }}
      sx={{ minWidth: 142, minHeight: 40 }}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <Alert
      role="alert"
      color="danger"
      variant="soft"
      size="sm"
      startDecorator={<AlertCircle size={17} />}
      sx={{ alignItems: "flex-start", fontSize: 14 }}
    >
      <span>{children}</span>
    </Alert>
  );
}
