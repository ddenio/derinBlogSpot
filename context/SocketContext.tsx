"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io } from "socket.io-client";

interface iSocketContext {
  refetchNotifications: boolean;
  handleRefetchNotifications: () => void;
}

export const SocketContext = createContext<iSocketContext | null>(null);

// The socket is receive-only: the server identifies the user from their
// session cookie and pushes a "getNotifications" ping when a notification is
// saved for them. The browser never tells the server who it is or who to ping.
export const SocketContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = useSession();
  const userId = session.data?.user?.userId;
  const [refetchNotifications, setRefetchNotifications] = useState(true);

  const handleRefetchNotifications = useCallback(() => {
    setRefetchNotifications((prev) => !prev);
  }, []);

  // Keyed on the id string: the session object changes identity whenever
  // Auth.js refreshes it (e.g. on window focus), which would otherwise tear
  // down and recreate the socket each time.
  useEffect(() => {
    if (!userId) return;

    const socket = io();

    // Refetch on every (re)connect so nothing sent while offline is missed
    socket.on("connect", handleRefetchNotifications);
    socket.on("getNotifications", handleRefetchNotifications);

    return () => {
      socket.off("connect", handleRefetchNotifications);
      socket.off("getNotifications", handleRefetchNotifications);
      socket.disconnect();
    };
  }, [userId, handleRefetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        refetchNotifications,
        handleRefetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === null) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};
