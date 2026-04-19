import mongoose, { Schema, Document } from "mongoose";
import { LeadStatus } from "../types/enums";

export interface IAdmission extends Document {
  tenantId: mongoose.Types.ObjectId;
  leadNumber: string;
  studentName: string;
  dateOfBirth?: Date;
  gender?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  appliedForClass: string;
  academicYear: string;
  source: "website" | "referral" | "walk-in" | "social-media" | "other";
  status: LeadStatus;
  assignedTo?: mongoose.Types.ObjectId;
  followUps: {
    date: Date;
    notes: string;
    nextFollowUpDate?: Date;
    createdBy: mongoose.Types.ObjectId;
    channel: "call" | "whatsapp" | "email" | "in-person";
  }[];
  convertedAt?: Date;
  convertedStudentId?: mongoose.Types.ObjectId;
  droppedReason?: string;
  automatedReminders: {
    sentAt: Date;
    channel: string;
    messageType: string;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSchema = new Schema<IAdmission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    leadNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    dateOfBirth: Date,
    gender: String,
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: String,
    address: String,
    appliedForClass: { type: String, required: true },
    academicYear: { type: String, required: true },
    source: {
      type: String,
      enum: ["website", "referral", "walk-in", "social-media", "other"],
      default: "walk-in",
    },
    status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    followUps: [
      {
        date: { type: Date, default: Date.now },
        notes: String,
        nextFollowUpDate: Date,
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        channel: { type: String, enum: ["call", "whatsapp", "email", "in-person"] },
      },
    ],
    convertedAt: Date,
    convertedStudentId: { type: Schema.Types.ObjectId, ref: "Student" },
    droppedReason: String,
    automatedReminders: [
      {
        sentAt: Date,
        channel: String,
        messageType: String,
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

AdmissionSchema.index({ tenantId: 1, leadNumber: 1 }, { unique: true });
AdmissionSchema.index({ tenantId: 1, status: 1 });
AdmissionSchema.index({ tenantId: 1, parentPhone: 1 });

export const Admission = mongoose.model<IAdmission>("Admission", AdmissionSchema);
