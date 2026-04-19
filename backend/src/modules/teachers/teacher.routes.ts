// teacher.routes.ts
import { FastifyInstance } from "fastify";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "../../types/enums";
import { z } from "zod";
import { Teacher } from "../../models/teacher.model";
import { User } from "../../models/user.model";
import { AppError } from "../../utils/errors";

export async function teacherRoutes(fastify: FastifyInstance) {
  const adminHandler = [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)];

  fastify.get("/", { preHandler: [authenticate] }, async (req, reply) => {
    const { page = "1", limit = "20", search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.user.tenantId };
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [teachers, total] = await Promise.all([
      Teacher.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
      Teacher.countDocuments(filter),
    ]);
    return reply.send({ success: true, data: { teachers, pagination: { total, page: parseInt(page), limit: parseInt(limit) } } });
  });

  fastify.get("/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const teacher = await Teacher.findOne({ _id: id, tenantId: req.user.tenantId })
      .populate("classesAssigned.classId", "name").lean();
    if (!teacher) throw new AppError("Teacher not found", 404);
    return reply.send({ success: true, data: teacher });
  });

  fastify.post("/", { preHandler: adminHandler }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      qualification: z.string(),
      experience: z.number().default(0),
      subjects: z.array(z.string()).default([]),
      joiningDate: z.string(),
      gender: z.enum(["male", "female", "other"]),
      salary: z.number().optional(),
    }).parse(req.body);

    const existing = await User.findOne({ email: body.email, tenantId: req.user.tenantId });
    if (existing) throw new AppError("User with this email already exists", 400);

    const user = await User.create({
      tenantId: req.user.tenantId,
      name: body.name,
      email: body.email,
      password: `Teacher@${Date.now()}`,
      role: UserRole.TEACHER,
      phone: body.phone,
    });

    const teacherId = `TCH-${Date.now()}`;
    const teacher = await Teacher.create({
      ...body,
      tenantId: req.user.tenantId,
      userId: user._id,
      teacherId,
      joiningDate: new Date(body.joiningDate),
    });

    return reply.status(201).send({ success: true, data: teacher });
  });

  fastify.patch("/:id", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { $set: req.body as Record<string, unknown> },
      { new: true }
    );
    if (!teacher) throw new AppError("Teacher not found", 404);
    return reply.send({ success: true, data: teacher });
  });

  fastify.delete("/:id", { preHandler: adminHandler }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await Teacher.findOneAndUpdate({ _id: id, tenantId: req.user.tenantId }, { isActive: false });
    return reply.send({ success: true, message: "Teacher deactivated" });
  });
}
