"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import { ChevronDown } from "lucide-react";
import { featuredTags, tags } from "@/lib/tags";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TagPill from "./TagPill";

import "./Tags.css";

const Tags = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("tag") || "All";

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const isFeatured = featuredTags.includes(selected);
  const rowTags = isFeatured ? featuredTags : [...featuredTags, selected];

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const select = (tag: string) => {
    const url = qs.stringifyUrl(
      {
        url: "/blog/feed/1",
        query: { tag: tag === "All" ? null : tag },
      },
      { skipNull: true },
    );

    router.push(url);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="border-t">
      <div className="max-w-[1920px] w-full mx-auto px-4 py-3 xl:px-20">
        <div className="flex flex-row items-center gap-2 overflow-x-auto no-scrollbar">
          {rowTags.map((tag) => (
            <TagPill
              key={tag}
              selected={tag === selected}
              onClick={() => select(tag)}
            >
              {tag}
            </TagPill>
          ))}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={<TagPill className="flex items-center gap-1" />}
            >
              More
              <ChevronDown size={16} />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(90vw,32rem)]">
              <Input
                placeholder="Search tags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <TagPill
                    key={tag}
                    selected={tag === selected}
                    onClick={() => select(tag)}
                  >
                    {tag}
                  </TagPill>
                ))}
                {!filteredTags.length && (
                  <span className="text-muted-foreground">No tags found.</span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Tags;
