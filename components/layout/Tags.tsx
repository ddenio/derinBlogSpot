"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { featuredTags, tags } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import "./Tags.css";

const pillClasses =
  "shrink-0 whitespace-nowrap rounded-full border border-transparent px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors";
const idleClasses =
  "bg-secondary text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground";
const activeClasses = "bg-primary text-primary-foreground";

const Tags = () => {
  const [selected, setSelected] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const isFeatured = featuredTags.includes(selected);
  const rowTags = isFeatured ? featuredTags : [...featuredTags, selected];

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const select = (tag: string) => {
    setSelected(tag);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="border-t">
      <div className="max-w-[1920px] w-full mx-auto px-4 py-3 xl:px-20">
        <div className="flex flex-row items-center gap-2 overflow-x-auto no-scrollbar">
          {rowTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => select(tag)}
              className={cn(
                pillClasses,
                tag === selected ? activeClasses : idleClasses,
              )}
            >
              {tag}
            </button>
          ))}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={cn(pillClasses, idleClasses, "flex items-center gap-1")}
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
                  <button
                    key={tag}
                    type="button"
                    onClick={() => select(tag)}
                    className={cn(
                      pillClasses,
                      tag === selected ? activeClasses : idleClasses,
                    )}
                  >
                    {tag}
                  </button>
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
