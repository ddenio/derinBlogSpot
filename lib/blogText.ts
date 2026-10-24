// Plain-text helpers for a blog's content. The content is BlockNote's JSON: an
// array of blocks, each with inline `content` (and, for tables, `rows`/`cells`)
// plus nested `children`. Pure and import-free so they are easy to test.

const WORDS_PER_MINUTE = 200;
const MAX_EXCERPT_LENGTH = 180;

// Block types worth quoting in a preview. Headings, code and media make a poor
// excerpt, so they are skipped unless there is nothing else.
const EXCERPT_BLOCK_TYPES = new Set([
  "paragraph",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
]);

type Block = {
  type?: string;
  content?: unknown;
  children?: unknown;
};

const parseBlocks = (content: string): Block[] => {
  try {
    const parsed: unknown = JSON.parse(content);

    // Only real objects count: `[null]` or `[1]` must not crash the feed
    return Array.isArray(parsed)
      ? (parsed.filter((b) => b && typeof b === "object") as Block[])
      : [];
  } catch {
    return [];
  }
};

// All the text inside a node: inline items, links, table cells, anything nested.
// Inline pieces are joined directly (so bold text next to a comma stays
// "word," and not "word ,"); table rows and cells are joined with spaces.
const textOf = (node: unknown, separator = ""): string => {
  if (typeof node === "string") return node;

  if (Array.isArray(node))
    return node.map((child) => textOf(child)).join(separator);

  if (node && typeof node === "object") {
    const { text, content, rows, cells } = node as {
      text?: unknown;
      content?: unknown;
      rows?: unknown;
      cells?: unknown;
    };

    // Empty parts are dropped so an inline item adds no stray spaces
    return [
      typeof text === "string" ? text : "",
      textOf(content),
      textOf(rows, " "),
      textOf(cells, " "),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "";
};

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

const collectBlocks = (blocks: Block[], out: Block[]) => {
  blocks.forEach((block) => {
    if (!block || typeof block !== "object") return;

    out.push(block);

    if (Array.isArray(block.children))
      collectBlocks(block.children as Block[], out);
  });

  return out;
};

// A short plain-text preview. Cuts at a word boundary when there is one, and
// hard-cuts text without spaces (a long URL, Chinese or Japanese text).
const makeExcerpt = (text: string) => {
  if (text.length <= MAX_EXCERPT_LENGTH) return text;

  const cut = text.slice(0, MAX_EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > MAX_EXCERPT_LENGTH * 0.6 ? lastSpace : cut.length;

  return `${cut.slice(0, end).trimEnd()}…`;
};

// Parses the post once and returns what a card needs. `minutes` is 0 for an
// empty post, so the card can leave the reading time out.
export const getPostPreview = (content: string) => {
  const blocks = collectBlocks(parseBlocks(content), []);
  const texts = blocks.map((block) => squash(textOf(block.content)));

  const words = texts.join(" ").split(" ").filter(Boolean).length;

  const prose = blocks
    .map((block, index) => ({ block, text: texts[index] }))
    .filter(({ block, text }) =>
      Boolean(text && block.type && EXCERPT_BLOCK_TYPES.has(block.type)),
    )
    .map(({ text }) => text);

  const candidates = prose.length ? prose : texts.filter(Boolean);

  return {
    excerpt: makeExcerpt(candidates.join(" ")),
    minutes: words ? Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) : 0,
  };
};
