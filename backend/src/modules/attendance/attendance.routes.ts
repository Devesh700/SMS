import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { AttendanceService } from "./attendance.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole, AttendanceStatus } from "../../types/enums";

export async function attendanceRoutes(fastify: FastifyInstance) {
  const service = new AttendanceService();
  const teacherHandler = [
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  ];

  // Mark attendance
  fastify.post("/mark", { preHandler: teacherHandler }, async (req, reply) => {
    const body = z.object({
      date: z.string(),
      classId: z.string(),
      section: z.string(),
      academicYear: z.string(),
      records: z.array(z.object({
        entityId: z.string(),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
      })),
    }).parse(req.body);

    const result = await service.markAttendance(req.user.tenantId, body, req.user.userId);
    return reply.status(201).send({ success: true, data: result });
  });

  // Get attendance for a class on a date
  fastify.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const result = await service.getAttendance(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });

  // Monthly report for a class
  fastify.get("/report", { preHandler: [authenticate] }, async (req, reply) => {
    const query = req.query as { classId: string; section: string; month: string; year: string };
    const result = await service.getMonthlyReport(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });

  // Absentees today
  fastify.get("/absentees/today", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.getTodayAbsentees(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Analytics
  fastify.get("/analytics", { preHandler: [authenticate] }, async (req, reply) => {
    const query = req.query as { classId?: string; month?: string; year?: string };
    const result = await service.getAnalytics(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });
}
