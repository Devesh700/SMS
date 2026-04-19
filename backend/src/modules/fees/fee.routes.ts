import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { FeeService } from "./fee.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole, PaymentMethod } from "../../types/enums";

export async function feeRoutes(fastify: FastifyInstance) {
  const service = new FeeService();
  const adminHandler = [
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  ];

  // --- Fee Structures ---
  fastify.get("/structures", { preHandler: [authenticate] }, async (req, reply) => {
    const result = await service.listFeeStructures(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  fastify.post("/structures", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      name: z.string(),
      classId: z.string().optional(),
      components: z.array(z.object({
        name: z.string(),
        amount: z.number(),
        isOptional: z.boolean().default(false),
        frequency: z.enum(["monthly", "quarterly", "annually", "one-time"]),
      })),
      academicYear: z.string(),
    }).parse(req.body);

    const result = await service.createFeeStructure(req.user.tenantId, body);
    return reply.status(201).send({ success: true, data: result });
  });

  // --- Invoices ---
  fastify.get("/invoices", { preHandler: adminHandler }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const result = await service.listInvoices(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });

  fastify.post("/invoices", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      studentId: z.string(),
      feeStructureId: z.string(),
      academicYear: z.string(),
      dueDate: z.string(),
      discountAmount: z.number().default(0),
    }).parse(req.body);

    const result = await service.createInvoice(req.user.tenantId, body);
    return reply.status(201).send({ success: true, data: result });
  });

  fastify.get("/invoices/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await service.getInvoice(req.user.tenantId, id);
    return reply.send({ success: true, data: result });
  });

  // Record payment
  fastify.post("/invoices/:id/payment", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      amount: z.number().positive(),
      method: z.nativeEnum(PaymentMethod),
      transactionId: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    const result = await service.recordPayment(req.user.tenantId, id, {
      ...body,
      receivedBy: req.user.userId,
    });
    return reply.send({ success: true, data: result });
  });

  // Defaulters list
  fastify.get("/defaulters", { preHandler: adminHandler }, async (req, reply) => {
    const result = await service.getDefaulters(req.user.tenantId);
    return reply.send({ success: true, data: result });
  });

  // Revenue analytics
  fastify.get("/analytics", { preHandler: adminHandler }, async (req, reply) => {
    const query = req.query as { year?: string };
    const result = await service.getRevenueAnalytics(req.user.tenantId, query.year);
    return reply.send({ success: true, data: result });
  });

  // Send fee reminder
  fastify.post("/invoices/:id/reminder", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await service.sendFeeReminder(req.user.tenantId, id);
    return reply.send({ success: true, message: "Reminder queued successfully" });
  });
}
