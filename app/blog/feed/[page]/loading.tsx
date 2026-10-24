import { BlogListSkeleton } from "@/components/blog/BlogSkeletons";

// Same two-column frame as the feed page, so nothing jumps when it loads
const Loading = () => (
  <div className="mx-auto flex w-full max-w-6xl items-start gap-8 lg:pr-4">
    <div className="min-w-0 flex-1">
      <BlogListSkeleton />
    </div>
    <div className="hidden w-72 shrink-0 lg:block" />
  </div>
);

export default Loading;
