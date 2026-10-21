import type { ReactNode } from "react";
import { LEGAL_LAST_UPDATED } from "@/lib/siteInfo";

export const LegalPage = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <article className="mx-auto w-full max-w-3xl px-2 py-10 sm:px-4">
    <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Last updated: {LEGAL_LAST_UPDATED}
    </p>
    <div className="mt-6">{children}</div>
  </article>
);

export const LegalSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mt-9">
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="mt-3 space-y-3 leading-7 text-foreground/90 [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
      {children}
    </div>
  </section>
);
