import React from "react";

interface TagProps {
  children: React.ReactNode;
}

const Tag = ({ children }: TagProps) => {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground sm:text-sm">
      {children}
    </span>
  );
};

export default Tag;
