import { Suspense } from "react";
import type { RangeDays } from "@/lib/analytics/range";
import Heading from "../common/Heading";
import DbAnalyticsSection from "./DbAnalyticsSection";
import RangeToggle from "./RangeToggle";
import SectionSkeleton from "./SectionSkeleton";

const AdminDashboard = ({ range }: { range: RangeDays }) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Analytics" lg />
        <RangeToggle range={range} />
      </div>
      {/* key={range} so switching the range shows the skeleton again */}
      <Suspense key={range} fallback={<SectionSkeleton />}>
        <DbAnalyticsSection range={range} />
      </Suspense>
    </div>
  );
};

export default AdminDashboard;
