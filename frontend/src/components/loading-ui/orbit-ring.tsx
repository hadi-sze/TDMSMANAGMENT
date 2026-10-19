import { cn } from "@/lib/utils";

function OrbitRing({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-orbit-ring-rotation {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-slot="orbit-ring"] {
            animation: none !important;
          }
        }
      `}</style>
      <span
        data-slot="orbit-ring"
        role="status"
        className={cn("relative inline-block", className)}
        style={{
          animation:
            "loading-ui-orbit-ring-rotation var(--duration, 1s) linear infinite",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-current"
          style={{ opacity: 0.25 }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 rounded-full border-2 border-transparent border-b-current"
          style={{
            width: "116.667%",
            height: "116.667%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <span className="sr-only">در حال بارگذاری</span>
      </span>
    </>
  );
}

export { OrbitRing };
