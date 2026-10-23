import { getTrafficAnalytics } from "@/actions/admin/getTrafficAnalytics";
import type { RangeDays } from "@/lib/analytics/range";
import { cn } from "@/lib/utils";
import Alert from "../common/Alert";
import Heading from "../common/Heading";
import FunnelBars from "./FunnelBars";
import RankedList from "./RankedList";
import StatTile from "./StatTile";
import TimeSeriesChart from "./TimeSeriesChart";

const TrafficAnalyticsSection = async ({ range }: { range: RangeDays }) => {
  const res = await getTrafficAnalytics(range);

  if (!res.success)
    return (
      <section aria-labelledby="traffic" className="flex flex-col gap-4">
        <div id="traffic">
          <Heading title="Traffic" md />
        </div>
        {res.notConfigured ? (
          <Alert message="Traffic analytics isn't set up here. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to turn it on." />
        ) : (
          <Alert error message={res.error} />
        )}
      </section>
    );

  const { totals, series, topBlogs, referrers, countries, funnel } =
    res.success;
  const periodLabel = `vs previous ${range} days`;

  const compare = (key: keyof typeof totals) => ({
    ...totals[key],
    periodLabel,
  });

  return (
    <section aria-labelledby="traffic" className="flex flex-col gap-4">
      <div id="traffic">
        <Heading title="Traffic" md />
        <p className="text-sm text-muted-foreground">
          Visits to the site from PostHog over the last {range} days (UTC days;
          today is still in progress). Tracking is cookieless, so a visitor who
          comes back, or reloads the page, is counted again: “Visitors”
          overstates unique people, and more so over longer ranges. Admins are
          never tracked.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile
          label="Visitors"
          value={totals.visitors.current}
          comparison={compare("visitors")}
        />
        <StatTile
          label="Pageviews"
          value={totals.pageviews.current}
          comparison={compare("pageviews")}
        />
        <StatTile
          label="Blog views"
          value={totals.blogViews.current}
          comparison={compare("blogViews")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TimeSeriesChart
          title="Visitors and pageviews"
          data={series}
          series={[
            { key: "visitors", label: "Visitors", color: "var(--chart-1)" },
            { key: "pageviews", label: "Pageviews", color: "var(--chart-2)" },
          ]}
        />
        <TimeSeriesChart
          title="Blog views"
          data={series}
          series={[
            { key: "blogViews", label: "Blog views", color: "var(--chart-3)" },
          ]}
        />
      </div>

      <div
        className={cn(
          "grid gap-4",
          countries.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <RankedList
          title="Top blogs"
          description="By views"
          items={topBlogs}
          emptyText="No blog views yet."
        />
        <RankedList
          title="Where visitors come from"
          description="Referring sites, by visitors. “Direct” means no referrer."
          items={referrers}
          emptyText="No referrers yet."
        />
        {countries.length > 0 && (
          <RankedList
            title="Countries"
            description="By visitors"
            items={countries}
          />
        )}
      </div>

      <FunnelBars
        title="Sign-up funnel"
        description="People who signed up in this period and what they did next, in order. Only sign-ups recorded by the live site since this tracking was added are counted."
        steps={funnel}
        emptyText="No sign-ups in this period yet."
      />
    </section>
  );
};

export default TrafficAnalyticsSection;
