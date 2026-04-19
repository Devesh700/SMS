import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "./dashboard.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "../../types/enums";

export async function dashboardRoutes(fastify: FastifyInstance) {
  const service = new DashboardService();
  const adminHandler = [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)];

  // Main dashboard stats
  fastify.get("/stats", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getDashboardStats(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Revenue chart data
  fastify.get("/revenue", { preHandler: adminHandler }, async (req, reply) => {
    const query = req.query as { year?: string };
    const result = await service.getRevenueChart(req.user.tenantId, query.year);
    return reply.send({ success: true, data: result });
  });

  // Enrollment trends
  fastify.get("/enrollment", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getEnrollmentTrends(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Attendance overview
  fastify.get("/attendance-overview", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getAttendanceOverview(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Recent activities
  fastify.get("/activity", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getRecentActivity(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Alerts
  fastify.get("/alerts", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.getAlerts(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });
}
