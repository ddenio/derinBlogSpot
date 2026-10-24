import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: { href: string; label: string };
}

const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
    <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
      <Icon size={24} aria-hidden />
    </div>
    <h2 className="text-lg font-semibold">{title}</h2>
    {message && (
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    )}
    {action && (
      <Link
        href={action.href}
        className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
      >
        {action.label}
      </Link>
    )}
  </div>
);

export default EmptyState;
