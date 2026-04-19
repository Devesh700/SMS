import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole, LeadStatus } from "../../types/enums";
import { Admission } from "../../models/admission.model";
import { AppError } from "../../utils/errors";

export async function admissionRoutes(fastify: FastifyInstance) {
  const adminHandler = [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)];

  fastify.get("/", { preHandler: adminHandler }, async (req, reply) => {
    const { page = "1", limit = "20", status, search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.user.tenantId };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { studentName: { $regex: search, $options: "i" } },
      { parentPhone: { $regex: search, $options: "i" } },
      { leadNumber: { $regex: search, $options: "i" } },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      Admission.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
      Admission.countDocuments(filter),
    ]);
    return reply.send({ success: true, data: { leads, pagination: { total, page: parseInt(page) } } });
  });

  fastify.get("/:id", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const lead = await Admission.findOne({ _id: id, tenantId: req.user.tenantId }).lean();
    if (!lead) throw new AppError("Lead not found", 404);
    return reply.send({ success: true, data: lead });
  });

  fastify.post("/", { preHandler: [authenticate] }, async (req, reply) => {
    const body = z.object({
      studentName: z.string().min(2),
      parentName: z.string().min(2),
      parentPhone: z.string().min(10),
      parentEmail: z.string().email().optional(),
      appliedForClass: z.string(),
      academicYear: z.string(),
      source: z.enum(["website", "referral", "walk-in", "social-media", "other"]).default("walk-in"),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    const leadNumber = `LEAD-${Date.now()}`;
    const lead = await Admission.create({ ...body, tenantId: req.user.tenantId, leadNumber });
    return reply.status(201).send({ success: true, data: lead });
  });

  // Update lead status
  fastify.patch("/:id/status", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: LeadStatus; reason?: string };
    const update: Record<string, unknown> = { status };
    if (status === LeadStatus.DROPPED && reason) update.droppedReason = reason;
    if (status === LeadStatus.CONVERTED) update.convertedAt = new Date();
    const lead = await Admission.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { $set: update },
      { new: true }
    );
    if (!lead) throw new AppError("Lead not found", 404);
    return reply.send({ success: true, data: lead });
  });

  // Add follow-up
  fastify.post("/:id/followup", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      notes: z.string(),
      nextFollowUpDate: z.string().optional(),
      channel: z.enum(["call", "whatsapp", "email", "in-person"]),
    }).parse(req.body);
    const lead = await Admission.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      {
        $push: {
          followUps: {
            ...body,
            date: new Date(),
            nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : undefined,
            createdBy: req.user.userId,
          },
        },
        $set: { status: LeadStatus.FOLLOW_UP },
      },
      { new: true }
    );
    if (!lead) throw new AppError("Lead not found", 404);
    return reply.send({ success: true, data: lead });
  });

  // Analytics
  fastify.get("/analytics/conversion", { preHandler: adminHandler }, async (req, reply) => {
    const stats = await Admission.aggregate([
      { $match: { tenantId: req.user.tenantId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return reply.send({ success: true, data: stats });
  });
}
