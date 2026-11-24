import { cn } from "@/lib/utils";

/** Aveluna mark (green cross and leaf, same image as the browser tab icon) with the wordmark. */
export function BrandLogo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/apple-touch-icon.png"
        alt=""
        aria-hidden="true"
        width={180}
        height={180}
        className={cn("shrink-0", lg ? "h-14 w-14" : "h-10 w-10 sm:h-11 sm:w-11")}
      />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display font-bold tracking-tight text-foreground", lg ? "text-4xl" : "text-2xl sm:text-[1.7rem]")}>
          Aveluna
        </span>
        <span className={cn("font-semibold uppercase tracking-[0.2em] text-primary", lg ? "mt-1 text-sm" : "mt-0.5 text-[0.65rem]")}>
          Pharmacy
        </span>
      </span>
    </span>
  );
}
