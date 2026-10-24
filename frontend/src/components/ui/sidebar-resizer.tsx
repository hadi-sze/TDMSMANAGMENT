"use client";

import { useRef } from "react";

export function SidebarResizer({
  width,
  onResize,
  onDragging,
}: {
  width: number;
  onResize: (width: number) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const start = useRef<{ x: number; width: number } | null>(null);
  const resize = (value: number) =>
    onResize(
      Math.round(Math.max(220, Math.min(420, window.innerWidth * 0.42, value))),
    );
  return (
    <div
      className="sidebar-resizer"
      role="separator"
      aria-label="تغییر عرض نوار کناری"
      aria-orientation="vertical"
      aria-valuemin={220}
      aria-valuemax={420}
      aria-valuenow={width}
      tabIndex={0}
      title="برای تغییر عرض بکشید؛ برای بازنشانی دوبار کلیک کنید"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = {
          x: event.clientX,
          width:
            event.currentTarget.parentElement!.getBoundingClientRect().width,
        };
        onDragging(true);
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        resize(
          start.current.width +
            (event.clientX - start.current.x) * (rtl ? -1 : 1),
        );
      }}
      onPointerUp={(event) => {
        start.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        onDragging(false);
      }}
      onLostPointerCapture={() => {
        start.current = null;
        onDragging(false);
      }}
      onPointerCancel={() => {
        start.current = null;
        onDragging(false);
      }}
      onDoubleClick={() => onResize(280)}
      onKeyDown={(event) => {
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          resize(
            width + (event.key === "ArrowLeft" ? -1 : 1) * (rtl ? -1 : 1) * 20,
          );
        } else if (event.key === "Home") {
          event.preventDefault();
          resize(220);
        } else if (event.key === "End") {
          event.preventDefault();
          resize(420);
        }
      }}
    >
      <span />
    </div>
  );
}
