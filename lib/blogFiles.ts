// Finds every Edge Store file a blog uses (cover image + media blocks inside
// the content), so those files can be cleaned up when the blog or its
// author's account is deleted.

const EDGESTORE_URL_PREFIX = "https://files.edgestore.dev/";

// BlockNote content is a JSON array of blocks (with nested `children`).
// Media blocks (image, video, file, audio) keep their file in `props.url`.
const collectEdgeStoreUrls = (node: unknown, urls: Set<string>) => {
  if (Array.isArray(node)) {
    node.forEach((child) => collectEdgeStoreUrls(child, urls));
    return;
  }

  if (node && typeof node === "object") {
    const { props, children } = node as {
      props?: { url?: unknown };
      children?: unknown;
    };

    if (
      typeof props?.url === "string" &&
      props.url.startsWith(EDGESTORE_URL_PREFIX)
    ) {
      urls.add(props.url);
    }

    collectEdgeStoreUrls(children, urls);
  }
};

export const getBlogFileUrls = (coverImage: string | null, content: string) => {
  const urls = new Set<string>();

  if (coverImage?.startsWith(EDGESTORE_URL_PREFIX)) urls.add(coverImage);

  try {
    collectEdgeStoreUrls(JSON.parse(content), urls);
  } catch {
    // Unparseable content: only the cover image is cleaned up.
  }

  return [...urls];
};
