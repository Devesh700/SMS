"use client";
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { addNotification } from "@/store/slices/notificationSlice";
import toast from "react-hot-toast";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, user, tenant, token } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      if (tenant?.id) socket.emit("join:tenant", tenant.id);
      if (user?.id) socket.emit("join:user", user.id);
    });

    // Real-time notification events
    socket.on("fee:reminder-sent", (data: { invoiceId: string; studentName: string }) => {
      toast.success(`Fee reminder sent for ${data.studentName}`);
    });

    socket.on("attendance:alert", (data: { studentId: string; date: string }) => {
      toast(`Absence alert sent`, { icon: "📋" });
    });

    socket.on("admission:followup", () => {
      toast("Admission follow-up message sent", { icon: "📝" });
    });

    socket.on("notification:new", (notification: { title: string; message: string; type: string }) => {
      dispatch(addNotification({ ...notification, id: Date.now().toString(), isRead: false, createdAt: new Date().toISOString() }));
      toast(notification.message, { icon: "🔔" });
    });

    socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => { socket.disconnect(); };
  }, [isAuthenticated, token, tenant?.id, user?.id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
