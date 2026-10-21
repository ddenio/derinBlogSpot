import Link from "next/link";
import { SearchX, ShieldAlert, TriangleAlert } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

type ErrorPageVariant = "forbidden" | "notFound" | "error";

const variants = {
  forbidden: {
    Icon: ShieldAlert,
    title: "You don't have access to this page",
    message: "You're signed in, but this page belongs to someone else.",
  },
  notFound: {
    Icon: SearchX,
    title: "We couldn't find that",
    message: "It may have been removed, or the link might be wrong.",
  },
  error: {
    Icon: TriangleAlert,
    title: "Something went wrong",
    message: "Please try again in a moment.",
  },
} as const;

const ErrorPage = ({
  variant = "error",
  title,
  message,
}: {
  variant?: ErrorPageVariant;
  title?: string;
  message?: string;
}) => {
  const { Icon, ...defaults } = variants[variant];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card/50 p-8 text-center shadow-sm">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            variant === "notFound"
              ? "bg-blue-500/10 text-blue-500"
              : "bg-rose-500/10 text-rose-500",
          )}
        >
          <Icon size={32} />
        </div>
        <h1 className="text-2xl font-bold">{title ?? defaults.title}</h1>
        <p className="text-muted-foreground">{message ?? defaults.message}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog/feed/1"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Back to the feed
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
