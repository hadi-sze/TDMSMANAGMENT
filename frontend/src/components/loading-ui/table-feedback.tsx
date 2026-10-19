"use client";

import { useEffect, useState, type ReactNode } from "react";
import { OrbitRing } from "@/components/loading-ui/orbit-ring";

/** Brief feedback for local table changes; network operations remain busy until settled. */
export function TableFeedback({
  changeKey,
  busy = false,
  children,
}: {
  changeKey: string;
  busy?: boolean;
  children: ReactNode;
}) {
  const [settledKey, setSettledKey] = useState(changeKey);
  const changing = settledKey !== changeKey;
  useEffect(() => {
    if (!changing) return;
    const timer = window.setTimeout(() => setSettledKey(changeKey), 220);
    return () => window.clearTimeout(timer);
  }, [changeKey, changing]);
  const pending = busy || changing;
  return (
    <div className="table-feedback" aria-busy={pending}>
      <div className="table-scroll" inert={pending}>
        {children}
      </div>
      {pending && (
        <div className="table-feedback-overlay">
          <div className="table-feedback-label">
            <OrbitRing className="size-8 text-primary" />
            <span>در حال به‌روزرسانی جدول…</span>
          </div>
        </div>
      )}
    </div>
  );
}
