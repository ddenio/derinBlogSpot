import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/siteInfo";

const Footer = () => {
  return (
    <footer className="mt-12 border-t py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-between gap-3 px-2 xl:px-20">
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}
        </span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
