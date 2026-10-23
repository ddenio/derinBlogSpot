// A row in a ranked list (top blogs, authors, tags, referrers, ...)
export type RankedItem = {
  id: string;
  label: string;
  value: number;
  hint?: string;
  href?: string;
};
