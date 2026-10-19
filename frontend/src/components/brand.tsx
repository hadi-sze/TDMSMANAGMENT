import { cn } from "@/lib/utils";
import Image from "next/image";
export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("brand", className)}>
      <Image
        src="/branding/nioc-logo.webp"
        alt=""
        width={32}
        height={36}
        className="brand-logo"
      />
      {!compact && (
        <span className="brand-wordmark">
          TDMS<span>MANAGMENT</span>
        </span>
      )}
    </span>
  );
}
