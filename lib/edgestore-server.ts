import { auth } from "@/auth";
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
        if (owner !== ctx.userId) return false;
      }

      return true;
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      if (!ctx.userId) return false;

      return ctx.role === "ADMIN" || fileInfo.metadata?.userId === ctx.userId;
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
