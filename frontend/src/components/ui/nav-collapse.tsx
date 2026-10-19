import type { ReactNode } from "react";

// Keep the panel mounted so CSS can animate both expansion and collapse.
// Closed links are immediately removed from keyboard and accessibility access.
export function NavCollapse({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="nav-collapse"
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="nav-collapse-inner">{children}</div>
    </div>
  );
}
