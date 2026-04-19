import mongoose from "mongoose";
import { Student } from "../../models/student.model";
import { Teacher } from "../../models/teacher.model";
import { Class } from "../../models/class.model";
import { FeeInvoice } from "../../models/fee.model";
import { Attendance } from "../../models/attendance.model";
import { Admission } from "../../models/admission.model";
import { cacheGet, cacheSet } from "../../config/redis";

export class DashboardService {
  async getDashboardStats(tenantId: string) {
    const cacheKey = `dashboard:stats:${tenantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const tid = new mongoose.Types.ObjectId(tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      feeStats,
      todayAttendance,
      newLeads,
      recentAdmissions,
    ] = await Promise.all([
      Student.countDocuments({ tenantId, status: "active" }),
      Teacher.countDocuments({ tenantId, isActive: true }),
      Class.countDocuments({ tenantId, isActive: true }),
      FeeInvoice.aggregate([
        { $match: { tenantId: tid } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: "$paidAmount" },
            totalPending: { $sum: "$balanceAmount" },
            overdueCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { tenantId: tid, date: today } },
        { $unwind: "$records" },
        {
          $group: {
            _id: "$records.status",
            count: { $sum: 1 },
          },
        },
      ]),
      Admission.countDocuments({ tenantId, status: "new" }),
      Admission.countDocuments({
        tenantId,
        status: "converted",
        convertedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const attendanceMap: Record<string, number> = {};
    todayAttendance.forEach((a: { _id: string; count: number }) => {
      attendanceMap[a._id] = a.count;
    });

    const totalMarked = Object.values(attendanceMap).reduce((a, b) => a + b, 0);
    const presentCount = attendanceMap["present"] || 0;

    const stats = {
      totalStudents,
      totalTeachers,
      totalClasses,
      fees: feeStats[0] || { totalCollected: 0, totalPending: 0, overdueCount: 0 },
      attendance: {
        ...attendanceMap,
        total: totalMarked,
        percentage: totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0,
      },
      leads: { newLeads, recentAdmissions },
    };

    await cacheSet(cacheKey, stats, 120); // Cache for 2 mins
    return stats;
  }

  async getRevenueChart(tenantId: string, year?: string) {
    const y = parseInt(year || new Date().getFullYear().toString());
    const tid = new mongoose.Types.ObjectId(tenantId);

    const data = await FeeInvoice.aggregate([
      {
        $match: {
          tenantId: tid,
          createdAt: {
            $gte: new Date(`${y}-01-01`),
            $lte: new Date(`${y}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          billed: { $sum: "$netAmount" },
          collected: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chart = months.map((name, i) => {
      const found = data.find((d: { _id: number }) => d._id === i + 1);
      return { month: name, billed: found?.billed || 0, collected: found?.collected || 0 };
    });

    return chart;
  }

  async getEnrollmentTrends(tenantId: string) {
    const tid = new mongoose.Types.ObjectId(tenantId);

    const data = await Student.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: { $month: "$admissionDate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((name, i) => ({
      month: name,
      admissions: data.find((d: { _id: number }) => d._id === i + 1)?.count || 0,
    }));
  }

  async getAttendanceOverview(tenantId: string) {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const data = await Attendance.aggregate([
      { $match: { tenantId: tid, date: { $gte: last7 } } },
      { $unwind: "$records" },
      {
        $group: {
          _id: { date: "$date", status: "$records.status" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    return data;
  }

  async getRecentActivity(tenantId: string) {
    const [recentStudents, recentAdmissions, recentPayments] = await Promise.all([
      Student.find({ tenantId }).sort({ createdAt: -1 }).limit(5).select("name studentId createdAt").lean(),
      Admission.find({ tenantId }).sort({ createdAt: -1 }).limit(5).select("studentName status createdAt").lean(),
      FeeInvoice.find({ tenantId, paidAmount: { $gt: 0 } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("studentId", "name")
        .select("paidAmount updatedAt status")
        .lean(),
    ]);

    return { recentStudents, recentAdmissions, recentPayments };
  }

  async getAlerts(tenantId: string) {
    const alerts = [];

    // Overdue fees
    const overdueCount = await FeeInvoice.countDocuments({
      tenantId,
      status: "overdue",
    });
    if (overdueCount > 0) {
      alerts.push({
        type: "warning",
        title: "Fee Overdue",
        message: `${overdueCount} students have overdue fees`,
        link: "/dashboard/fees?status=overdue",
      });
    }

    // Low attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAtt = await Attendance.find({ tenantId: tenantId, date: today }).lean();
    let absentCount = 0;
    todayAtt.forEach((a) => {
      absentCount += a.records.filter((r) => r.status === "absent").length;
    });
    if (absentCount > 0) {
      alerts.push({
        type: "info",
        title: "Attendance Alert",
        message: `${absentCount} students absent today`,
        link: "/dashboard/attendance",
      });
    }

    // New leads
    const newLeads = await Admission.countDocuments({ tenantId, status: "new" });
    if (newLeads > 0) {
      alerts.push({
        type: "info",
        title: "New Admissions",
        message: `${newLeads} new admission enquiries pending`,
        link: "/dashboard/admissions",
      });
    }

    return alerts;
  }
}
