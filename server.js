import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

export let io;

app.prepare().then(() => {
  const httpServer = createServer(handler);

  io = new Server(httpServer);

  // userId -> set of socket ids. A user can have several tabs/devices open,
  // and a reconnect must never be wiped out by the old socket disconnecting.
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    socket.on("addOnlineUser", (userId) => {
      if (typeof userId !== "string" || !userId) return;

      socket.data.userId = userId;

      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);

      console.log("Online users:", onlineUsers.size);
    });

    socket.on("onNotification", (recipientId) => {
      const sockets = onlineUsers.get(recipientId);

      if (sockets && sockets.size) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit("getNotifications");
        });
      } else {
        console.log(`Recipient ${recipientId} is not online`);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      const sockets = userId && onlineUsers.get(userId);

      if (sockets) {
        sockets.delete(socket.id);
        if (!sockets.size) onlineUsers.delete(userId);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.log(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
