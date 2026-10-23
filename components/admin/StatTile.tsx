import { ArrowDown, ArrowUp } from "lucide-react";
import { percentChange } from "@/lib/analytics/range";

interface StatTileProps {
  label: string;
  value: number;
  // When given, shows the change vs the previous period of the same length
  comparison?: { current: number; previous: number; periodLabel: string };
  hint?: string;
}

const Change = ({
  current,
  previous,
  periodLabel,
}: NonNullable<StatTileProps["comparison"]>) => {
  const change = percentChange(current, previous);

  // Nothing to compare against yet
  if (change === null && current === 0)
    return (
      <span className="text-xs text-muted-foreground">
        No activity {periodLabel}
      </span>
    );

  if (change === null)
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowUp aria-hidden className="size-3 text-emerald-600 dark:text-emerald-400" />
        <span className="sr-only">Up</span>
        New (none {periodLabel})
      </span>
    );

  if (change === 0)
    return (
      <span className="text-xs text-muted-foreground">
        No change {periodLabel}
      </span>
    );

  const Icon = change > 0 ? ArrowUp : ArrowDown;
  // percentChange reports a sub-1% change as +/-1, so say "<1%" instead
  const isTiny = Math.abs((current - previous) / previous) < 0.005;

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon
        aria-hidden
        className={
          change > 0
            ? "size-3 text-emerald-600 dark:text-emerald-400"
            : "size-3 text-rose-600 dark:text-rose-400"
        }
      />
      <span className="sr-only">{change > 0 ? "Up" : "Down"}</span>
      {isTiny ? "<1" : Math.abs(change)}% {periodLabel}
    </span>
  );
};

const StatTile = ({ label, value, comparison, hint }: StatTileProps) => {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-3xl font-bold tabular-nums">
        {value.toLocaleString("en-US")}
      </span>
      {comparison && <Change {...comparison} />}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
};

export default StatTile;
