import mongoose from "mongoose";
import { Attendance } from "../../models/attendance.model";
import { Student } from "../../models/student.model";
import { AppError } from "../../utils/errors";
import { AttendanceStatus, QueueName, JobName } from "../../types/enums";
import { getQueue } from "../../queues";

export class AttendanceService {
  async markAttendance(
    tenantId: string,
    data: {
      date: string;
      classId: string;
      section: string;
      academicYear: string;
      records: { entityId: string; status: AttendanceStatus; remarks?: string }[];
    },
    markedBy: string
  ) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const records = data.records.map((r) => ({
      entityId: new mongoose.Types.ObjectId(r.entityId),
      status: r.status,
      remarks: r.remarks,
      markedBy: new mongoose.Types.ObjectId(markedBy),
      markedAt: new Date(),
    }));

    const attendance = await Attendance.findOneAndUpdate(
      {
        tenantId,
        date,
        classId: data.classId,
        section: data.section,
      },
      {
        $set: {
          tenantId,
          date,
          classId: data.classId,
          section: data.section,
          records,
          academicYear: data.academicYear,
        },
      },
      { upsert: true, new: true }
    );

    // Queue alerts for absentees
    const absentees = data.records.filter((r) => r.status === AttendanceStatus.ABSENT);
    if (absentees.length > 0) {
      const queue = getQueue(QueueName.REMINDERS);
      for (const absent of absentees) {
        await queue.add(
          JobName.ATTENDANCE_ALERT,
          { tenantId, studentId: absent.entityId, date: data.date },
          { delay: 5000 }
        );
      }
    }

    return attendance;
  }

  async getAttendance(tenantId: string, query: Record<string, string>) {
    const { date, classId, section } = query;
    const filter: Record<string, unknown> = { tenantId };

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    }
    if (classId) filter.classId = new mongoose.Types.ObjectId(classId);
    if (section) filter.section = section;

    return Attendance.find(filter).lean();
  }

  async getMonthlyReport(
    tenantId: string,
    query: { classId: string; section: string; month: string; year: string }
  ) {
    const start = new Date(parseInt(query.year), parseInt(query.month) - 1, 1);
    const end = new Date(parseInt(query.year), parseInt(query.month), 0);

    const records = await Attendance.find({
      tenantId,
      classId: query.classId,
      section: query.section,
      date: { $gte: start, $lte: end },
    }).lean();

    const students = await Student.find({
      tenantId,
      classId: query.classId,
      section: query.section,
      status: "active",
    })
      .select("name studentId")
      .lean();

    const report = students.map((student) => {
      const summary = { present: 0, absent: 0, late: 0, halfDay: 0, total: records.length };
      records.forEach((r) => {
        const rec = r.records.find((x) => x.entityId.toString() === student._id.toString());
        if (rec) {
          if (rec.status === "present") summary.present++;
          else if (rec.status === "absent") summary.absent++;
          else if (rec.status === "late") summary.late++;
          else if (rec.status === "half_day") summary.halfDay++;
        }
      });
      return {
        student,
        summary,
        percentage:
          summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0,
      };
    });

    return { report, totalDays: records.length };
  }

  async getTodayAbsentees(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ tenantId, date: today })
      .populate({
        path: "records.entityId",
        select: "name studentId parent",
        model: "Student",
      })
      .lean();

    const absentees: unknown[] = [];
    records.forEach((r) => {
      r.records
        .filter((x) => x.status === AttendanceStatus.ABSENT)
        .forEach((x) => absentees.push({ ...x, classId: r.classId, section: r.section }));
    });

    return absentees;
  }

  async getAnalytics(
    tenantId: string,
    query: { classId?: string; month?: string; year?: string }
  ) {
    const match: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (query.classId) match.classId = new mongoose.Types.ObjectId(query.classId);

    const stats = await Attendance.aggregate([
      { $match: match },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$records.status",
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  }
}
