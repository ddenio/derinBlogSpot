"use client";

import { FaBlogger } from "react-icons/fa";
import Container from "./Container";
import ThemeToggle from "./ThemeToggle";
import SearchInput from "./SearchInput";
import Notifications from "./Notifications";
import UserButton from "./UserButton";
import Link from "next/link";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Tags from "./Tags";

const NavBar = () => {
  const session = useSession();
  const isLoggedIn = session.status === "authenticated";
  const router = useRouter();
  const pathname = usePathname();
  const showFilters = pathname.startsWith("/blog/feed");

  return (
    <nav className="sticky top-0 border-b z-50 bg-background">
      <Container>
        <div className="flex justify-between items-center gap-8">
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => router.push("/blog/feed/1")}
          >
            <FaBlogger size={24} />
            <div className="font-bold text-xl">DerinSpot.blog</div>
          </div>
          {showFilters && (
            <Suspense>
              <SearchInput />
            </Suspense>
          )}
          <div className="flex gap-5 sm:gap-8 items-center cursor-pointer">
            <ThemeToggle />
            {isLoggedIn && <Notifications />}
            {isLoggedIn && <UserButton />}
            {!isLoggedIn && (
              <>
                <Link href="/login">Login</Link>
                <Link href="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </Container>
      {showFilters && (
        <Suspense>
          <Tags />
        </Suspense>
      )}
    </nav>
  );
};

export default NavBar;
