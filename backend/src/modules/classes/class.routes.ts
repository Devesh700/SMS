import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "../../types/enums";
import { Class } from "../../models/class.model";
import { AppError } from "../../utils/errors";

export async function classRoutes(fastify: FastifyInstance) {
  const adminHandler = [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)];

  fastify.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const { academicYear } = req.query as { academicYear?: string };
    const filter: Record<string, unknown> = { tenantId: req.user.tenantId, isActive: true };
    if (academicYear) filter.academicYear = academicYear;
    const classes = await Class.find(filter)
      .populate("classTeacher", "name")
      .sort({ name: 1 })
      .lean();
    return reply.send({ success: true, data: classes });
  });

  fastify.get("/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const cls = await Class.findOne({ _id: id, tenantId: req.user.tenantId })
      .populate("classTeacher", "name email")
      .populate("subjects.teacherId", "name")
      .lean();
    if (!cls) throw new AppError("Class not found", 404);
    return reply.send({ success: true, data: cls });
  });

  fastify.post("/", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      name: z.string(),
      sections: z.array(z.string()).default(["A"]),
      academicYear: z.string(),
      capacity: z.number().default(40),
      subjects: z.array(z.object({
        name: z.string(),
        code: z.string().optional(),
        maxMarks: z.number().default(100),
        passingMarks: z.number().default(33),
      })).default([]),
    }).parse(req.body);

    const cls = await Class.create({ ...body, tenantId: req.user.tenantId });
    return reply.status(201).send({ success: true, data: cls });
  });

  fastify.patch("/:id", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const cls = await Class.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { $set: req.body as Record<string, unknown> },
      { new: true }
    );
    if (!cls) throw new AppError("Class not found", 404);
    return reply.send({ success: true, data: cls });
  });

  // Assign timetable
  fastify.put("/:id/timetable", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { timetable } = req.body as { timetable: unknown[] };
    const cls = await Class.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { $set: { timetable } },
      { new: true }
    );
    if (!cls) throw new AppError("Class not found", 404);
    return reply.send({ success: true, data: cls });
  });
}
