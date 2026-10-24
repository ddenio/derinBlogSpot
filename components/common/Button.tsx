"use client";

import { cn } from "@/lib/utils";
import { IconType } from "react-icons/lib";

interface ButtonProps {
  label: string;
  disabled?: boolean;
  outlined?: boolean;
  destructive?: boolean;
  small?: boolean;
  icon?: IconType;
  className?: string;
  type?: "submit" | "reset" | "button" | undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button = ({
  label,
  type,
  disabled,
  outlined,
  destructive,
  small,
  icon: Icon,
  className,
  onClick,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Default = the brand (primary) color; `outlined` is the quiet
        // secondary; `destructive` is for deleting things.
        "flex w-auto items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-5 py-2.5 my-2 font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        outlined &&
          "border-border bg-transparent text-foreground hover:bg-muted",
        destructive &&
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:text-black",
        small && "px-3 py-1 text-sm",
        className && className,
      )}
    >
      {Icon && <Icon size={20} />}
      {label}
    </button>
  );
};

export default Button;
