import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getSocketUserId, isSameOrigin } from "./lib/socketAuth.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

export let io;

app.prepare().then(() => {
  const httpServer = createServer(handler);

  io = new Server(httpServer, {
    // Only the site's own pages may open a socket
    allowRequest: (req, callback) => callback(null, isSameOrigin(req)),
  });

  // userId -> set of socket ids. A user can have several tabs/devices open,
  // and a reconnect must never be wiped out by the old socket disconnecting.
  const onlineUsers = new Map();

  // Identity comes from the signed session cookie, never from the client
  io.use(async (socket, next) => {
    const userId = await getSocketUserId(socket.request.headers.cookie);

    if (!userId) {
      console.log("Socket rejected: no valid session");
      return next(new Error("unauthorized"));
    }

    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    console.log("Online users:", onlineUsers.size);

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);

      if (sockets) {
        sockets.delete(socket.id);
        if (!sockets.size) onlineUsers.delete(userId);
      }
    });
  });

  // Called by the server (createNotification) once a notification has been
  // saved. Clients can no longer ask the server to ping other users.
  globalThis.__notifyUser = (userId) => {
    const sockets = onlineUsers.get(userId);

    if (!sockets || !sockets.size) return;

    sockets.forEach((socketId) => {
      io.to(socketId).emit("getNotifications");
    });
  };

  httpServer
    .once("error", (err) => {
      console.log(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
