import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { StudentService } from "./student.service";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "../../types/enums";

const createStudentSchema = z.object({
  name: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.string().optional(),
  classId: z.string(),
  section: z.string(),
  admissionDate: z.string(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  parent: z.object({
    fatherName: z.string().min(2),
    fatherPhone: z.string().min(10),
    fatherEmail: z.string().email().optional(),
    fatherOccupation: z.string().optional(),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
  }),
  previousSchool: z.string().optional(),
  notes: z.string().optional(),
});

export async function studentRoutes(fastify: FastifyInstance) {
  const service = new StudentService();
  const preHandler = [authenticate];
  const adminHandler = [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)];

  // List students
  fastify.get("/", { preHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const result = await service.listStudents(req.user.tenantId, query);
    return reply.send({ success: true, data: result });
  });

  // Get student by ID
  fastify.get("/:id", { preHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const student = await service.getStudent(req.user.tenantId, id);
    return reply.send({ success: true, data: student });
  });

  // Create student
  fastify.post("/", { preHandler: adminHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createStudentSchema.parse(req.body);
    const student = await service.createStudent(req.user.tenantId, body);
    return reply.status(201).send({ success: true, data: student });
  });

  // Update student
  fastify.patch("/:id", { preHandler: adminHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = createStudentSchema.partial().parse(req.body);
    const student = await service.updateStudent(req.user.tenantId, id, body);
    return reply.send({ success: true, data: student });
  });

  // Delete student
  fastify.delete("/:id", { preHandler: adminHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await service.deleteStudent(req.user.tenantId, id);
    return reply.send({ success: true, message: "Student deleted successfully" });
  });

  // Get student attendance summary
  fastify.get("/:id/attendance", { preHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const query = req.query as { month?: string; year?: string };
    const result = await service.getStudentAttendance(req.user.tenantId, id, query);
    return reply.send({ success: true, data: result });
  });

  // Get student fee summary
  fastify.get("/:id/fees", { preHandler }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const result = await service.getStudentFees(req.user.tenantId, id);
    return reply.send({ success: true, data: result });
  });
}
