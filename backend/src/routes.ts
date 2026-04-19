import { FastifyInstance } from "fastify";
import { authRoutes } from "./modules/auth/auth.routes";
import { studentRoutes } from "./modules/students/student.routes";
import { teacherRoutes } from "./modules/teachers/teacher.routes";
import { classRoutes } from "./modules/classes/class.routes";
import { feeRoutes } from "./modules/fees/fee.routes";
import { attendanceRoutes } from "./modules/attendance/attendance.routes";
import { admissionRoutes } from "./modules/admissions/admission.routes";
import { communicationRoutes } from "./modules/communication/communication.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { tenantRoutes } from "./modules/tenants/tenant.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";

export async function registerRoutes(fastify: FastifyInstance) {
  const API_PREFIX = "/api/v1";

  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  await fastify.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await fastify.register(studentRoutes, { prefix: `${API_PREFIX}/students` });
  await fastify.register(teacherRoutes, { prefix: `${API_PREFIX}/teachers` });
  await fastify.register(classRoutes, { prefix: `${API_PREFIX}/classes` });
  await fastify.register(feeRoutes, { prefix: `${API_PREFIX}/fees` });
  await fastify.register(attendanceRoutes, { prefix: `${API_PREFIX}/attendance` });
  await fastify.register(admissionRoutes, { prefix: `${API_PREFIX}/admissions` });
  await fastify.register(communicationRoutes, { prefix: `${API_PREFIX}/communication` });
  await fastify.register(notificationRoutes, { prefix: `${API_PREFIX}/notifications` });
  await fastify.register(tenantRoutes, { prefix: `${API_PREFIX}/tenants` });
  await fastify.register(dashboardRoutes, { prefix: `${API_PREFIX}/dashboard` });
}
