"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import queryString from "query-string";
import { useRouter, useSearchParams } from "next/navigation";

const SearchInput = () => {
  const router = useRouter();
  const params = useSearchParams();
  const urlTitle = params.get("title") ?? "";
  const [value, setValue] = useState(urlTitle);
  const lastSyncedTitle = useRef(urlTitle);

  // Pick up changes made outside this input (e.g. clicking a tag pill clears the title)
  useEffect(() => {
    if (urlTitle !== lastSyncedTitle.current) {
      lastSyncedTitle.current = urlTitle;
      setValue(urlTitle);
    }
  }, [urlTitle]);

  useEffect(() => {
    // Only navigate when the user's input differs from what the URL already has
    if (value === urlTitle) return;

    const timeout = setTimeout(() => {
      lastSyncedTitle.current = value;
      const currentQuery = queryString.parse(params.toString());

      const url = queryString.stringifyUrl(
        {
          url: "/blog/feed/1",
          query: { ...currentQuery, title: value },
        },
        {
          skipNull: true,
          skipEmptyString: true,
        },
      );

      router.push(url);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };

  return (
    <div className="relative hidden sm:block">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleOnChange}
        placeholder="Search"
        className="h-9 pl-9 bg-primary/10"
      />
    </div>
  );
};

export default SearchInput;
