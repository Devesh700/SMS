import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { CommunicationService } from "./communication.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole, CommunicationChannel } from "../../types/enums";

export async function communicationRoutes(fastify: FastifyInstance) {
  const service = new CommunicationService();
  const adminHandler = [
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  ];

  // Send broadcast message
  fastify.post("/broadcast", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      title: z.string(),
      message: z.string(),
      channels: z.array(z.nativeEnum(CommunicationChannel)),
      targetType: z.enum(["all", "class", "section", "custom"]),
      classId: z.string().optional(),
      section: z.string().optional(),
      studentIds: z.array(z.string()).optional(),
    }).parse(req.body);

    const result = await service.sendBroadcast(req.user.tenantId, body, req.user.userId);
    return reply.send({ success: true, data: result });
  });

  // Send individual message
  fastify.post("/send", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      channel: z.nativeEnum(CommunicationChannel),
      recipientId: z.string(),
      recipientType: z.enum(["student", "teacher", "parent"]),
      subject: z.string().optional(),
      message: z.string(),
    }).parse(req.body);

    const result = await service.sendIndividual(req.user.tenantId, body, req.user.userId);
    return reply.send({ success: true, data: result });
  });

  // Get communication logs
  fastify.get("/logs", { preHandler: adminHandler }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const result = await service.getLogs(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });

  // Scheduled messages
  fastify.post("/schedule", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      title: z.string(),
      message: z.string(),
      channels: z.array(z.nativeEnum(CommunicationChannel)),
      scheduledAt: z.string(),
      targetType: z.enum(["all", "class", "section"]),
      classId: z.string().optional(),
      section: z.string().optional(),
    }).parse(req.body);

    const result = await service.scheduleMessage(req.user.tenantId, body, req.user.userId);
    return reply.send({ success: true, data: result });
  });

  // Get communication templates
  fastify.get("/templates", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getTemplates(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });
}
