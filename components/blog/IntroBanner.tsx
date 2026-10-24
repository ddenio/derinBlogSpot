import Link from "next/link";
import { buttonVariants } from "../ui/button";

// Shown above the feed to logged-out visitors only (the feed page decides).
const IntroBanner = () => (
  <section className="mb-4 rounded-xl border bg-linear-to-br from-primary/15 via-card to-card p-5 sm:p-6">
    <h2 className="text-xl font-bold sm:text-2xl">
      Your favorite web dev blogs
    </h2>
    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
      Read, write and discuss. Free to join.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Link href="/register" className={buttonVariants({ size: "lg" })}>
        Create account
      </Link>
      <Link
        href="/login"
        className={buttonVariants({ variant: "ghost", size: "lg" })}
      >
        Log in
      </Link>
    </div>
  </section>
);

export default IntroBanner;
