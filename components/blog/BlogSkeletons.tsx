// Grey placeholders shown while a page loads (used by the loading.tsx files).

const Bar = ({ className }: { className: string }) => (
  <div
    className={`motion-safe:animate-pulse rounded-md bg-muted ${className}`}
  />
);

const BlogCardSkeleton = () => (
  <div className="rounded-xl border bg-card p-4 sm:p-5">
    <div className="flex items-center gap-2">
      <Bar className="size-6 rounded-full" />
      <Bar className="h-4 w-40" />
    </div>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
      <div className="flex flex-1 flex-col gap-3">
        <Bar className="h-6 w-4/5" />
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Bar className="h-6 w-16" />
          <Bar className="h-6 w-16" />
        </div>
      </div>
      <Bar className="aspect-5/2 w-full rounded-lg sm:aspect-auto sm:h-30 sm:w-48 sm:shrink-0" />
    </div>
  </div>
);

export const BlogListSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading posts"
    className="m-auto flex max-w-200 flex-col gap-4 px-4 pt-2"
  >
    <span className="sr-only">Loading posts…</span>
    {Array.from({ length: 4 }, (_, index) => (
      <BlogCardSkeleton key={index} />
    ))}
  </div>
);

export const PostSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading post"
    className="m-auto flex max-w-3xl flex-col gap-6"
  >
    <span className="sr-only">Loading post…</span>
    <Bar className="aspect-5/2 w-full rounded-lg" />
    <Bar className="h-6 w-48" />
    <Bar className="h-10 w-4/5" />
    <div className="flex flex-col gap-3">
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-11/12" />
      <Bar className="h-4 w-2/3" />
    </div>
  </div>
);
