import mongoose, { Schema, Document } from "mongoose";
import { AttendanceStatus } from "../types/enums";

export interface IAttendance extends Document {
  tenantId: mongoose.Types.ObjectId;
  date: Date;
  classId: mongoose.Types.ObjectId;
  section: string;
  type: "student" | "teacher";
  records: {
    entityId: mongoose.Types.ObjectId; // studentId or teacherId
    status: AttendanceStatus;
    remarks?: string;
    markedBy: mongoose.Types.ObjectId;
    markedAt: Date;
  }[];
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    date: { type: Date, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: String, required: true },
    type: { type: String, enum: ["student", "teacher"], default: "student" },
    records: [
      {
        entityId: { type: Schema.Types.ObjectId, required: true },
        status: { type: String, enum: Object.values(AttendanceStatus), required: true },
        remarks: String,
        markedBy: { type: Schema.Types.ObjectId, ref: "User" },
        markedAt: { type: Date, default: Date.now },
      },
    ],
    academicYear: { type: String, required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ tenantId: 1, date: 1, classId: 1, section: 1 }, { unique: true });
AttendanceSchema.index({ tenantId: 1, "records.entityId": 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
