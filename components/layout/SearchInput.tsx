import { Search } from "lucide-react";
import { Input } from "../ui/input";

const SearchInput = () => {
  return (
    <div className="relative hidden sm:block">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search" className="h-9 pl-9 bg-primary/10" />
    </div>
  );
};

export default SearchInput;
