"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

export type ChartSeries = {
  key: string;
  label: string;
  // Any CSS color; the theme tokens (var(--chart-1) ...) switch with dark mode
  color: string;
};

type ChartPoint = { date: string } & Record<string, string | number>;

interface TimeSeriesChartProps {
  title: string;
  data: ChartPoint[];
  series: ChartSeries[];
}

// Dates are YYYY-MM-DD UTC days; format them in UTC so they never shift
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });

const TimeSeriesChart = ({ title, data, series }: TimeSeriesChartProps) => {
  const config = Object.fromEntries(
    series.map(({ key, label, color }) => [key, { label, color }]),
  ) as ChartConfig;

  const totals = series.map((item) => ({
    ...item,
    total: data.reduce((sum, point) => sum + Number(point[item.key] ?? 0), 0),
  }));

  const isEmpty = totals.every((item) => item.total === 0);

  const summary = `${title}: ${totals
    .map((item) => `${item.total} ${item.label.toLowerCase()}`)
    .join(", ")} over ${data.length} days.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {/* Always shown for 2+ series so colour is never the only identifier */}
        {series.length > 1 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            {totals.map((item) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
                <span className="font-semibold text-foreground">
                  {item.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No activity in this period yet.
          </p>
        ) : (
          <div role="img" aria-label={summary}>
            <ChartContainer config={config} className="aspect-auto h-56 w-full">
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value: string) =>
                    formatDate(value, { month: "short", day: "numeric" })
                  }
                />
                <YAxis
                  width={32}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        formatDate(String(value), {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                  }
                />
                {series.map((item) => (
                  <Line
                    key={item.key}
                    dataKey={item.key}
                    type="linear"
                    stroke={`var(--color-${item.key})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        )}
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">View as table</summary>
          <div className="mt-2 max-h-56 overflow-auto">
            <table className="w-full text-left">
              <caption className="sr-only">{title}, one row per day</caption>
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th className="py-1 pr-3 font-medium">Date</th>
                  {series.map((item) => (
                    <th key={item.key} className="py-1 pr-3 font-medium">
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.date} className="border-t">
                    <td className="py-1 pr-3">{point.date}</td>
                    {series.map((item) => (
                      <td key={item.key} className="py-1 pr-3">
                        {point[item.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
