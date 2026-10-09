import { cn } from "@/lib/utils";

interface TagPillProps extends React.ComponentProps<"button"> {
  selected?: boolean;
}

const TagPill = ({ selected, className, ...props }: TagPillProps) => {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border border-transparent px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
};

export default TagPill;
