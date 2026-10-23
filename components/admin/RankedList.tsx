import Link from "next/link";
import type { RankedItem } from "@/lib/analytics/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RankedListProps {
  title: string;
  description?: string;
  items: RankedItem[];
  emptyText?: string;
  // Show each value as a share of the total instead of relative to the top row
  asShare?: boolean;
}

const RankedList = ({
  title,
  description,
  items,
  emptyText = "No data yet.",
  asShare,
}: RankedListProps) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...items.map((item) => item.value), 0);
  const denominator = asShare ? total : max;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {!items.length || denominator === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item) => {
              // A real value always gets a visible sliver; a zero gets none
              const width =
                item.value === 0
                  ? 0
                  : Math.max((item.value / denominator) * 100, 2);

              return (
                <li key={item.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="truncate hover:underline"
                        title={item.label}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="truncate" title={item.label}>
                        {item.label}
                      </span>
                    )}
                    <span className="shrink-0 font-semibold tabular-nums">
                      {item.value.toLocaleString("en-US")}
                      {asShare && total > 0 && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({Math.round((item.value / total) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        backgroundColor: "var(--chart-1)",
                      }}
                    />
                  </div>
                  {item.hint && (
                    <span className="truncate text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default RankedList;
