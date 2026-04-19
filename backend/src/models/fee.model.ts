import mongoose, { Schema, Document } from "mongoose";
import { FeeStatus, PaymentMethod } from "../types/enums";

// --- Fee Structure ---
export interface IFeeStructure extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  classId?: mongoose.Types.ObjectId;
  components: {
    name: string;
    amount: number;
    isOptional: boolean;
    frequency: "monthly" | "quarterly" | "annually" | "one-time";
  }[];
  totalAmount: number;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    components: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        isOptional: { type: Boolean, default: false },
        frequency: {
          type: String,
          enum: ["monthly", "quarterly", "annually", "one-time"],
          default: "annually",
        },
      },
    ],
    totalAmount: { type: Number, required: true },
    academicYear: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FeeStructure = mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);

// --- Fee Invoice ---
export interface IFeeInvoice extends Document {
  tenantId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  feeStructureId: mongoose.Types.ObjectId;
  academicYear: string;
  dueDate: Date;
  items: {
    name: string;
    amount: number;
    discount: number;
    finalAmount: number;
  }[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: FeeStatus;
  payments: {
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    paidAt: Date;
    receivedBy: mongoose.Types.ObjectId;
    receiptNumber: string;
    notes?: string;
  }[];
  remindersSent: number;
  lastReminderAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeInvoiceSchema = new Schema<IFeeInvoice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    academicYear: { type: String, required: true },
    dueDate: { type: Date, required: true },
    items: [
      {
        name: String,
        amount: Number,
        discount: { type: Number, default: 0 },
        finalAmount: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(FeeStatus), default: FeeStatus.PENDING },
    payments: [
      {
        amount: Number,
        method: { type: String, enum: Object.values(PaymentMethod) },
        transactionId: String,
        paidAt: { type: Date, default: Date.now },
        receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
        receiptNumber: String,
        notes: String,
      },
    ],
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: Date,
    notes: String,
  },
  { timestamps: true }
);

FeeInvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
FeeInvoiceSchema.index({ tenantId: 1, studentId: 1 });
FeeInvoiceSchema.index({ tenantId: 1, status: 1 });
FeeInvoiceSchema.index({ tenantId: 1, dueDate: 1 });

export const FeeInvoice = mongoose.model<IFeeInvoice>("FeeInvoice", FeeInvoiceSchema);
