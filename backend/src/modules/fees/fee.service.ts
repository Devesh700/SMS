import { FeeStructure, FeeInvoice } from "../../models/fee.model";
import { Student } from "../../models/student.model";
import { AppError } from "../../utils/errors";
import { FeeStatus, PaymentMethod, QueueName, JobName } from "../../types/enums";
import { getQueue } from "../../queues";
import { generateReceiptNumber } from "../../utils/helpers";

export class FeeService {
  async listFeeStructures(tenantId: string) {
    return FeeStructure.find({ tenantId, isActive: true })
      .populate("classId", "name")
      .lean();
  }

  async createFeeStructure(tenantId: string, data: {
    name: string;
    classId?: string;
    components: { name: string; amount: number; isOptional: boolean; frequency: string }[];
    academicYear: string;
  }) {
    const totalAmount = data.components.reduce((sum, c) => sum + c.amount, 0);
    return FeeStructure.create({ ...data, tenantId, totalAmount });
  }

  async listInvoices(tenantId: string, query: Record<string, string>) {
    const { page = "1", limit = "20", status, studentId, classId } = query;
    const filter: Record<string, unknown> = { tenantId };
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      FeeInvoice.find(filter)
        .populate("studentId", "name studentId classId section")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      FeeInvoice.countDocuments(filter),
    ]);

    return { invoices, pagination: { total, page: parseInt(page), limit: parseInt(limit) } };
  }

  async getInvoice(tenantId: string, id: string) {
    const invoice = await FeeInvoice.findOne({ _id: id, tenantId })
      .populate("studentId", "name studentId parent classId section")
      .populate("feeStructureId", "name")
      .lean();
    if (!invoice) throw new AppError("Invoice not found", 404);
    return invoice;
  }

  async createInvoice(tenantId: string, data: {
    studentId: string;
    feeStructureId: string;
    academicYear: string;
    dueDate: string;
    discountAmount: number;
  }) {
    const structure = await FeeStructure.findOne({
      _id: data.feeStructureId,
      tenantId,
    });
    if (!structure) throw new AppError("Fee structure not found", 404);

    const items = structure.components.map((c) => ({
      name: c.name,
      amount: c.amount,
      discount: 0,
      finalAmount: c.amount,
    }));

    const netAmount = structure.totalAmount - data.discountAmount;
    const invoiceNumber = `INV-${Date.now()}`;

    return FeeInvoice.create({
      tenantId,
      invoiceNumber,
      studentId: data.studentId,
      feeStructureId: data.feeStructureId,
      academicYear: data.academicYear,
      dueDate: new Date(data.dueDate),
      items,
      totalAmount: structure.totalAmount,
      discountAmount: data.discountAmount,
      netAmount,
      balanceAmount: netAmount,
      paidAmount: 0,
      status: FeeStatus.PENDING,
    });
  }

  async recordPayment(
    tenantId: string,
    invoiceId: string,
    data: {
      amount: number;
      method: PaymentMethod;
      transactionId?: string;
      notes?: string;
      receivedBy: string;
    }
  ) {
    const invoice = await FeeInvoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) throw new AppError("Invoice not found", 404);

    if (data.amount > invoice.balanceAmount) {
      throw new AppError("Payment amount exceeds balance", 400);
    }

    const receiptNumber = generateReceiptNumber();
    invoice.payments.push({
      amount: data.amount,
      method: data.method,
      transactionId: data.transactionId,
      paidAt: new Date(),
      receivedBy: data.receivedBy as unknown as import("mongoose").Types.ObjectId,
      receiptNumber,
      notes: data.notes,
    });

    invoice.paidAmount += data.amount;
    invoice.balanceAmount -= data.amount;

    if (invoice.balanceAmount === 0) {
      invoice.status = FeeStatus.PAID;
    } else if (invoice.paidAmount > 0) {
      invoice.status = FeeStatus.PARTIAL;
    }

    await invoice.save();
    return invoice;
  }

  async getDefaulters(tenantId: string) {
    const overdue = await FeeInvoice.find({
      tenantId,
      status: { $in: [FeeStatus.PENDING, FeeStatus.PARTIAL, FeeStatus.OVERDUE] },
      dueDate: { $lt: new Date() },
    })
      .populate("studentId", "name studentId parent classId section")
      .sort({ dueDate: 1 })
      .lean();

    // Mark as overdue
    const ids = overdue.filter((i) => i.status !== FeeStatus.OVERDUE).map((i) => i._id);
    if (ids.length > 0) {
      await FeeInvoice.updateMany(
        { _id: { $in: ids } },
        { status: FeeStatus.OVERDUE }
      );
    }

    return overdue;
  }

  async getRevenueAnalytics(tenantId: string, year?: string) {
    const currentYear = year || new Date().getFullYear().toString();
    const startDate = new Date(`${currentYear}-04-01`);
    const endDate = new Date(`${parseInt(currentYear) + 1}-03-31`);

    const monthly = await FeeInvoice.aggregate([
      {
        $match: {
          tenantId: new (require("mongoose").Types.ObjectId)(tenantId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalBilled: { $sum: "$netAmount" },
          totalCollected: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = await FeeInvoice.aggregate([
      {
        $match: {
          tenantId: new (require("mongoose").Types.ObjectId)(tenantId),
        },
      },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: "$netAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalPending: { $sum: "$balanceAmount" },
        },
      },
    ]);

    return { monthly, totals: totals[0] || {} };
  }

  async sendFeeReminder(tenantId: string, invoiceId: string) {
    const invoice = await FeeInvoice.findOne({ _id: invoiceId, tenantId })
      .populate("studentId", "name parent")
      .lean();
    if (!invoice) throw new AppError("Invoice not found", 404);

    const queue = getQueue(QueueName.REMINDERS);
    await queue.add(JobName.FEE_REMINDER, {
      tenantId,
      invoiceId,
      studentName: (invoice.studentId as unknown as { name: string }).name,
      amount: invoice.balanceAmount,
      dueDate: invoice.dueDate,
    });
  }
}
