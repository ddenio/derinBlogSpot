const NavBar = () => {
  return (
    <nav className="sticky top-0 border-b z-50 bg-white">
      <div className="flex justify-between items-center gap-8">
        <div className="flex items-center gap-1 cursor-pointer">
          <div>Icon</div>
          <div>Derins Blog Spot</div>
        </div>
        <div>Search</div>
        <div className="flex gap-5 sm:gap-8 items-center">
          <div>Theme</div>
          <div>Notifications</div>
          <div>UserMenu</div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
