import { FaBlogger } from "react-icons/fa";
import Container from "./Container";
import ThemeToggle from "./ThemeToggle";
import SearchInput from "./SearchInput";
import Notifications from "./Notifications";
import UserButton from "./UserButton";
import Link from "next/link";

const NavBar = () => {
  return (
    <nav className="sticky top-0 border-b z-50 bg-background">
      <Container>
        <div className="flex justify-between items-center gap-8">
          <div className="flex items-center gap-1 cursor-pointer">
            <FaBlogger size={24} />
            <div className="font-bold text-xl">DerinSpot.blog</div>
          </div>
          <SearchInput />
          <div className="flex gap-5 sm:gap-8 items-center">
            <ThemeToggle />
            <Notifications />
            <UserButton />
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default NavBar;
