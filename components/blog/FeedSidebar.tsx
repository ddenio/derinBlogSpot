import Link from "next/link";
import type { getFeedSidebar } from "@/lib/feedSidebar";

type Sidebar = Awaited<ReturnType<typeof getFeedSidebar>>;

const Panel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border bg-card p-4">
    <h2 className="text-sm font-semibold">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

const FeedSidebar = ({ tags, topPosts }: Sidebar) => {
  if (!tags.length && !topPosts.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {tags.length > 0 && (
        <Panel title="Popular tags">
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/blog/feed/1?tag=${encodeURIComponent(tag)}`}
                className="rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {tag}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
      {topPosts.length > 0 && (
        <Panel title="Popular posts">
          <ol className="flex flex-col gap-3">
            {topPosts.map((post, index) => (
              <li key={post.id} className="flex gap-3">
                <span
                  aria-hidden
                  className="w-4 shrink-0 text-sm font-semibold text-muted-foreground"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/blog/${post.id}`}
                    className="line-clamp-2 text-sm font-medium wrap-anywhere hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {post._count.claps}{" "}
                    {post._count.claps === 1 ? "clap" : "claps"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
};

export default FeedSidebar;
