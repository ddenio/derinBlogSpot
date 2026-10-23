import { getDbAnalytics } from "@/actions/admin/getDbAnalytics";
import type { RangeDays } from "@/lib/analytics/range";
import Alert from "../common/Alert";
import Heading from "../common/Heading";
import RankedList from "./RankedList";
import StatTile from "./StatTile";
import TimeSeriesChart from "./TimeSeriesChart";

const DbAnalyticsSection = async ({ range }: { range: RangeDays }) => {
  const res = await getDbAnalytics(range);

  if (res.error || !res.success)
    return <Alert error message={res.error ?? "Error fetching analytics"} />;

  const { totals, range: rangeTotals, series, ...rankings } = res.success;
  const periodLabel = `vs previous ${range} days`;

  const compare = (key: keyof typeof rangeTotals) => ({
    ...rangeTotals[key],
    periodLabel,
  });

  return (
    <section aria-labelledby="site-activity" className="flex flex-col gap-4">
      <div id="site-activity">
        <Heading title="Site activity" md />
        <p className="text-sm text-muted-foreground">
          Signups and engagement from the database over the last {range} days
          (UTC days). Today is included, so the latest day is still partial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total users" value={totals.users} />
        <StatTile
          label="New users"
          value={rangeTotals.signups.current}
          comparison={compare("signups")}
        />
        <StatTile label="Published blogs" value={totals.publishedBlogs} />
        <StatTile
          label="New blogs"
          value={rangeTotals.blogs.current}
          comparison={compare("blogs")}
          hint="Created in this period and now published"
        />
        <StatTile
          label="Claps"
          value={rangeTotals.claps.current}
          comparison={compare("claps")}
        />
        <StatTile
          label="Comments"
          value={rangeTotals.comments.current}
          comparison={compare("comments")}
        />
        <StatTile
          label="Bookmarks"
          value={rangeTotals.bookmarks.current}
          comparison={compare("bookmarks")}
        />
        <StatTile
          label="Follows"
          value={rangeTotals.follows.current}
          comparison={compare("follows")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TimeSeriesChart
          title="Signups and new blogs"
          data={series}
          series={[
            { key: "signups", label: "Signups", color: "var(--chart-1)" },
            { key: "blogs", label: "New blogs", color: "var(--chart-2)" },
          ]}
        />
        <TimeSeriesChart
          title="Engagement"
          data={series}
          series={[
            { key: "claps", label: "Claps", color: "var(--chart-1)" },
            { key: "comments", label: "Comments", color: "var(--chart-2)" },
            { key: "bookmarks", label: "Bookmarks", color: "var(--chart-3)" },
            { key: "follows", label: "Follows", color: "var(--chart-4)" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankedList
          title="Top blogs"
          description="By claps, all time"
          items={rankings.topBlogs}
          emptyText="No claps yet."
        />
        <RankedList
          title="Top authors"
          description="By followers, all time"
          items={rankings.topAuthors}
          emptyText="No followers yet."
        />
        <RankedList
          title="Popular tags"
          description="Across published blogs"
          items={rankings.topTags}
          emptyText="No tags yet."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankedList
          title="Sign-in methods"
          description="Accounts, all time"
          items={rankings.signInMethods}
          asShare
        />
        <RankedList
          title="Email verification"
          description="Users, all time"
          items={[
            {
              id: "verified",
              label: "Verified",
              value: totals.verifiedUsers,
            },
            {
              id: "unverified",
              label: "Not verified",
              value: totals.users - totals.verifiedUsers,
            },
          ]}
          asShare
        />
        <RankedList
          title="Published vs drafts"
          description="Blogs, all time"
          items={[
            {
              id: "published",
              label: "Published",
              value: totals.publishedBlogs,
            },
            { id: "drafts", label: "Drafts", value: totals.draftBlogs },
          ]}
          asShare
        />
      </div>
    </section>
  );
};

export default DbAnalyticsSection;
