import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";

export function setupSocketIO(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join tenant room after auth
    socket.on("join:tenant", (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      logger.info(`Socket ${socket.id} joined tenant room: ${tenantId}`);
    });

    // Join user-specific room
    socket.on("join:user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    // Real-time attendance marking broadcast
    socket.on("attendance:marked", (data: {
      tenantId: string;
      classId: string;
      section: string;
      date: string;
    }) => {
      socket.to(`tenant:${data.tenantId}`).emit("attendance:updated", data);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

// Helper to emit to a tenant
export function emitToTenant(
  io: SocketIOServer,
  tenantId: string,
  event: string,
  data: unknown
): void {
  io.to(`tenant:${tenantId}`).emit(event, data);
}

// Helper to emit to a specific user
export function emitToUser(
  io: SocketIOServer,
  userId: string,
  event: string,
  data: unknown
): void {
  io.to(`user:${userId}`).emit(event, data);
}
