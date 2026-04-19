import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "../../types/enums";
import { Tenant } from "../../models/tenant.model";
import { AppError } from "../../utils/errors";

export async function tenantRoutes(fastify: FastifyInstance) {
  // Get current tenant info
  fastify.get("/me", { preHandler: [authenticate] }, async (req, reply) => {
    const tenant = await Tenant.findById(req.user.tenantId).lean();
    if (!tenant) throw new AppError("Tenant not found", 404);
    return reply.send({ success: true, data: tenant });
  });

  // Update tenant settings
  fastify.patch("/settings", {
    preHandler: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)],
  }, async (req, reply) => {
    const body = z.object({
      settings: z.object({
        timezone: z.string().optional(),
        currency: z.string().optional(),
        language: z.string().optional(),
        enableWhatsApp: z.boolean().optional(),
        enableSMS: z.boolean().optional(),
        enableEmail: z.boolean().optional(),
        autoFeeReminders: z.boolean().optional(),
        autoAttendanceAlerts: z.boolean().optional(),
      }).optional(),
      name: z.string().optional(),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      contactPhone: z.string().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
      }).optional(),
    }).parse(req.body);

    const update: Record<string, unknown> = {};
    if (body.name) update.name = body.name;
    if (body.logo) update.logo = body.logo;
    if (body.primaryColor) update.primaryColor = body.primaryColor;
    if (body.contactPhone) update.contactPhone = body.contactPhone;
    if (body.address) update.address = body.address;
    if (body.settings) {
      Object.entries(body.settings).forEach(([key, val]) => {
        if (val !== undefined) update[`settings.${key}`] = val;
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: update },
      { new: true }
    );
    return reply.send({ success: true, data: tenant });
  });

  // Super admin: list all tenants
  fastify.get("/", {
    preHandler: [authenticate, authorize(UserRole.SUPER_ADMIN)],
  }, async (req, reply) => {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
    return reply.send({ success: true, data: tenants });
  });
}
