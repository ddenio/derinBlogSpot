import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { initEdgeStoreClient } from "@edgestore/server/core";

type Context = {
  userId?: string;
  role?: "USER" | "ADMIN";
};

const es = initEdgeStore.context<Context>().create();

// Looks up who uploaded a file. Assigned below once the backend client exists
// (the router needs it, and the client needs the router).
let getFileOwner: (url: string) => Promise<string | undefined> = async () =>
  undefined;

// Files uploaded before ownership tracking have no metadata. Treat those as
// owned by whoever uses them as the cover of one of their own blogs.
const isLegacyOwner = async (userId: string, url: string) => {
  const blog = await db.blog.findFirst({
    where: { userId, coverImage: url },
    select: { id: true },
  });

  return !!blog;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const edgeStoreRouter = es.router({
  publicFiles: es
    .fileBucket({
      maxSize: MAX_FILE_SIZE,
      accept: ["image/*", "video/*", "audio/*", "application/pdf"],
    })
    // Remember who uploaded each file so only they (or an admin) can change it
    .metadata(({ ctx }) => ({ userId: ctx.userId ?? "" }))
    .beforeUpload(async ({ ctx, fileInfo }) => {
      if (!ctx.userId) return false;

      // Replacing a file deletes the old one, so check ownership of that too
      if (fileInfo.replaceTargetUrl && ctx.role !== "ADMIN") {
        const owner = await getFileOwner(fileInfo.replaceTargetUrl);

        if (owner) {
          if (owner !== ctx.userId) return false;
        } else if (!(await isLegacyOwner(ctx.userId, fileInfo.replaceTargetUrl))) {
          return false;
        }
      }

      return true;
    })
    .beforeDelete(async ({ ctx, fileInfo }) => {
      if (!ctx.userId) return false;
      if (ctx.role === "ADMIN") return true;

      const owner = fileInfo.metadata?.userId;
      if (owner) return owner === ctx.userId;

      return isLegacyOwner(ctx.userId, fileInfo.url);
    }),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext: async (): Promise<Context> => {
    const session = await auth();

    return {
      userId: session?.user.userId,
      role: session?.user.role,
    };
  },
});

export const backendClient = initEdgeStoreClient({
  router: edgeStoreRouter,
});

getFileOwner = async (url) => {
  try {
    const file = await backendClient.publicFiles.getFile({ url });
    return file.metadata?.userId || undefined;
  } catch {
    return undefined;
  }
};

export type EdgeStoreRouter = typeof edgeStoreRouter;
