declare global {
  var __notifyUser: ((userId: string) => void) | undefined;
}

// Pushes a live "refetch your notifications" ping to a user's open tabs.
// server.js sets globalThis.__notifyUser when it starts (the custom server
// and Next run in the same Node process). If it isn't there, the notification
// is still saved and shows up on the user's next page load.
export const notifyUser = (userId: string) => {
  try {
    if (globalThis.__notifyUser) {
      globalThis.__notifyUser(userId);
    } else {
      console.warn("notifyUser: socket server not available");
    }
  } catch (error) {
    console.error("notifyUser failed:", error);
  }
};
