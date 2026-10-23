import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export type FunnelBarStep = { label: string; count: number };

interface FunnelBarsProps {
  title: string;
  description?: string;
  steps: FunnelBarStep[];
  emptyText?: string;
}

const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

const FunnelBars = ({
  title,
  description,
  steps,
  emptyText = "No data yet.",
}: FunnelBarsProps) => {
  const first = steps[0]?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {first === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {steps.map((step, index) => {
              const previous = steps[index - 1]?.count ?? step.count;

              return (
                <li key={step.label} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="mr-2 text-muted-foreground">
                        {index + 1}.
                      </span>
                      {step.label}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {step.count.toLocaleString("en-US")}
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({percent(step.count, first)}%)
                      </span>
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${step.count === 0 ? 0 : Math.max(percent(step.count, first), 2)}%`,
                        backgroundColor: "var(--chart-1)",
                      }}
                    />
                  </div>
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {percent(step.count, previous)}% of the previous step
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

export default FunnelBars;
