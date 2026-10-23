const Pulse = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-xl bg-muted ${className}`} />
);

const SectionSkeleton = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading analytics"
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Pulse key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pulse className="h-72" />
        <Pulse className="h-72" />
      </div>
    </div>
  );
};

export default SectionSkeleton;
