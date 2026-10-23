import Link from "next/link";
import { type RangeDays, RANGES } from "@/lib/analytics/range";
import { buttonVariants } from "../ui/button";

const RangeToggle = ({ range }: { range: RangeDays }) => {
  return (
    <nav aria-label="Date range" className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Last</span>
      {RANGES.map((option) => {
        const isActive = option === range;

        return (
          <Link
            key={option}
            href={`/admin?range=${option}`}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={buttonVariants({
              variant: isActive ? "default" : "outline",
              size: "sm",
            })}
          >
            {option} days
          </Link>
        );
      })}
    </nav>
  );
};

export default RangeToggle;
