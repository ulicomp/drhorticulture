import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "icon" | "glass" | "primary" | "ghost";
  children: ReactNode;
};

export function AppButton({ variant = "glass", className, children, ...props }: Props) {
  const styles = {
    icon: "glass focus-ring grid size-13 shrink-0 place-items-center rounded-full text-foreground transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45",
    glass:
      "glass focus-ring flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-medium text-foreground transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40",
    primary:
      "focus-ring flex min-h-14 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_8px_28px_color-mix(in_oklab,var(--vegetation)_18%,transparent)] transition active:scale-[.99] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
    ghost:
      "focus-ring flex min-h-11 items-center justify-center rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground",
  };
  return (
    <button className={cn(styles[variant], className)} {...props}>
      {children}
    </button>
  );
}
