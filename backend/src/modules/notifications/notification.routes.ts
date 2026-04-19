// notification.routes.ts
import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/auth.middleware";
import { Notification } from "../../models/notification.model";

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user.userId, isRead: false });
    return reply.send({ success: true, data: { notifications, unreadCount } });
  });

  fastify.patch("/:id/read", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { isRead: true, readAt: new Date() }
    );
    return reply.send({ success: true });
  });

  fastify.patch("/read-all", { preHandler: [authenticate] }, async (req, reply) => {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return reply.send({ success: true });
  });
}
