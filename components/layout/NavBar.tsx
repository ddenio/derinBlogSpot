"use client";

import { FaBlogger } from "react-icons/fa";
import { Search, X } from "lucide-react";
import Container from "./Container";
import ThemeToggle from "./ThemeToggle";
import SearchInput from "./SearchInput";
import Notifications from "./Notifications";
import UserButton from "./UserButton";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Tags from "./Tags";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

const NavBar = () => {
  const session = useSession();
  const isLoggedIn = session.status === "authenticated";
  const pathname = usePathname();
  const showFilters = pathname.startsWith("/blog/feed");
  // Phones only: the search box opens as its own row under the navbar. It
  // remembers the page it was opened on, so it is closed again on any other
  // page (and when coming back to the feed).
  const [searchOpenOn, setSearchOpenOn] = useState<string | null>(null);
  const searchOpen = searchOpenOn === pathname;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container>
        <div className="flex justify-between items-center gap-3 sm:gap-8">
          <Link
            href="/blog/feed/1"
            className="flex min-w-0 items-center gap-1"
          >
            <FaBlogger size={24} className="shrink-0 text-primary" />
            <span className="font-bold text-lg sm:text-xl truncate">
              DerinSpot.blog
            </span>
          </Link>
          {showFilters && (
            <Suspense>
              <SearchInput />
            </Suspense>
          )}
          <div className="flex shrink-0 gap-4 sm:gap-8 items-center">
            {showFilters && (
              <button
                type="button"
                onClick={() => setSearchOpenOn(searchOpen ? null : pathname)}
                aria-label={searchOpen ? "Close search" : "Search posts"}
                aria-expanded={searchOpen}
                aria-controls="mobile-search"
                className="-m-2 cursor-pointer p-2 sm:hidden"
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            )}
            <ThemeToggle />
            {isLoggedIn && <Notifications />}
            {isLoggedIn && <UserButton />}
            {!isLoggedIn && (
              <>
                <Link href="/login" className="hidden sm:inline">
                  Login
                </Link>
                <Link href="/register" className="hidden sm:inline">
                  Register
                </Link>
                {/* Phones: one button; the login page links to Register */}
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
      {showFilters && searchOpen && (
        <div
          id="mobile-search"
          role="search"
          onKeyDown={(event) => {
            if (event.key === "Escape") setSearchOpenOn(null);
          }}
          className="border-t px-4 py-2 sm:hidden"
        >
          <Suspense>
            <SearchInput className="block w-full" autoFocus />
          </Suspense>
        </div>
      )}
      {showFilters && (
        <Suspense>
          <Tags />
        </Suspense>
      )}
    </nav>
  );
};

export default NavBar;
