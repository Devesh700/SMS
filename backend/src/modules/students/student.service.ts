import mongoose from "mongoose";
import { Student } from "../../models/student.model";
import { Attendance } from "../../models/attendance.model";
import { FeeInvoice } from "../../models/fee.model";
import { AppError } from "../../utils/errors";
import { generateStudentId } from "../../utils/helpers";
import { cacheGet, cacheSet, cacheDeletePattern } from "../../config/redis";

export class StudentService {
  async listStudents(
    tenantId: string,
    query: Record<string, string>
  ) {
    const {
      page = "1",
      limit = "20",
      search,
      classId,
      section,
      status,
    } = query;

    const filter: Record<string, unknown> = { tenantId };
    if (status) filter.status = status;
    if (classId) filter.classId = new mongoose.Types.ObjectId(classId);
    if (section) filter.section = section;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { "parent.fatherPhone": { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate("classId", "name")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Student.countDocuments(filter),
    ]);

    return {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getStudent(tenantId: string, id: string) {
    const cacheKey = `student:${tenantId}:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const student = await Student.findOne({ _id: id, tenantId })
      .populate("classId", "name sections")
      .lean();

    if (!student) throw new AppError("Student not found", 404);

    await cacheSet(cacheKey, student, 300);
    return student;
  }

  async createStudent(tenantId: string, data: Record<string, unknown>) {
    const studentId = await generateStudentId(tenantId);
    const admissionNumber = `ADM-${Date.now()}`;

    const student = await Student.create({
      ...data,
      tenantId,
      studentId,
      admissionNumber,
      dateOfBirth: new Date(data.dateOfBirth as string),
      admissionDate: new Date(data.admissionDate as string),
    });

    await cacheDeletePattern(`students:${tenantId}:*`);
    return student;
  }

  async updateStudent(
    tenantId: string,
    id: string,
    data: Record<string, unknown>
  ) {
    const student = await Student.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate("classId", "name");

    if (!student) throw new AppError("Student not found", 404);

    await cacheDeletePattern(`student:${tenantId}:${id}`);
    return student;
  }

  async deleteStudent(tenantId: string, id: string) {
    const student = await Student.findOneAndUpdate(
      { _id: id, tenantId },
      { status: "dropped" }
    );
    if (!student) throw new AppError("Student not found", 404);
    await cacheDeletePattern(`student:${tenantId}:${id}`);
  }

  async getStudentAttendance(
    tenantId: string,
    studentId: string,
    query: { month?: string; year?: string }
  ) {
    const filter: Record<string, unknown> = {
      tenantId,
      "records.entityId": new mongoose.Types.ObjectId(studentId),
    };

    if (query.month && query.year) {
      const start = new Date(parseInt(query.year), parseInt(query.month) - 1, 1);
      const end = new Date(parseInt(query.year), parseInt(query.month), 0);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).lean();

    const summary = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
    records.forEach((r) => {
      const rec = r.records.find(
        (x) => x.entityId.toString() === studentId
      );
      if (rec) {
        summary.total++;
        if (rec.status === "present") summary.present++;
        else if (rec.status === "absent") summary.absent++;
        else if (rec.status === "late") summary.late++;
        else if (rec.status === "half_day") summary.halfDay++;
      }
    });

    const attendancePercent =
      summary.total > 0
        ? Math.round((summary.present / summary.total) * 100)
        : 0;

    return { summary, attendancePercent, records };
  }

  async getStudentFees(tenantId: string, studentId: string) {
    const invoices = await FeeInvoice.find({ tenantId, studentId })
      .sort({ createdAt: -1 })
      .lean();

    const totalDue = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

    return { invoices, summary: { totalDue, totalPaid, totalPending } };
  }
}
