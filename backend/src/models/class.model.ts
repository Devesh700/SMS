import mongoose, { Schema, Document } from "mongoose";

export interface IClass extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string; // e.g. "Class 10"
  sections: string[]; // e.g. ["A", "B", "C"]
  subjects: {
    name: string;
    code: string;
    teacherId?: mongoose.Types.ObjectId;
    maxMarks: number;
    passingMarks: number;
  }[];
  classTeacher?: mongoose.Types.ObjectId;
  academicYear: string; // e.g. "2024-25"
  timetable: {
    day: string;
    periods: {
      periodNumber: number;
      subject: string;
      teacherId: mongoose.Types.ObjectId;
      startTime: string;
      endTime: string;
    }[];
  }[];
  feeStructureId?: mongoose.Types.ObjectId;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    sections: [{ type: String }],
    subjects: [
      {
        name: { type: String, required: true },
        code: String,
        teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
        maxMarks: { type: Number, default: 100 },
        passingMarks: { type: Number, default: 33 },
      },
    ],
    classTeacher: { type: Schema.Types.ObjectId, ref: "Teacher" },
    academicYear: { type: String, required: true },
    timetable: [
      {
        day: String,
        periods: [
          {
            periodNumber: Number,
            subject: String,
            teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
    feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure" },
    capacity: { type: Number, default: 40 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassSchema.index({ tenantId: 1, name: 1, academicYear: 1 }, { unique: true });

export const Class = mongoose.model<IClass>("Class", ClassSchema);
