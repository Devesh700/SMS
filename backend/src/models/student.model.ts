import mongoose, { Schema, Document } from "mongoose";
import { StudentStatus } from "../types/enums";

export interface IStudent extends Document {
  tenantId: mongoose.Types.ObjectId;
  studentId: string; // auto-generated
  name: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  bloodGroup?: string;
  photo?: string;
  classId: mongoose.Types.ObjectId;
  section: string;
  rollNumber?: string;
  admissionDate: Date;
  admissionNumber: string;
  status: StudentStatus;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  parent: {
    fatherName: string;
    fatherPhone: string;
    fatherEmail?: string;
    fatherOccupation?: string;
    motherName: string;
    motherPhone: string;
    motherEmail?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;
  };
  documents: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  previousSchool?: string;
  academicHistory: {
    year: string;
    classId: mongoose.Types.ObjectId;
    result?: string;
    percentage?: number;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    studentId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    bloodGroup: String,
    photo: String,
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: String, required: true },
    rollNumber: String,
    admissionDate: { type: Date, required: true },
    admissionNumber: { type: String, required: true },
    status: { type: String, enum: Object.values(StudentStatus), default: StudentStatus.ACTIVE },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    parent: {
      fatherName: { type: String, required: true },
      fatherPhone: { type: String, required: true },
      fatherEmail: String,
      fatherOccupation: String,
      motherName: String,
      motherPhone: String,
      motherEmail: String,
      guardianName: String,
      guardianPhone: String,
      guardianRelation: String,
    },
    documents: [
      {
        type: { type: String },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    previousSchool: String,
    academicHistory: [
      {
        year: String,
        classId: { type: Schema.Types.ObjectId, ref: "Class" },
        result: String,
        percentage: Number,
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

StudentSchema.index({ tenantId: 1, studentId: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, classId: 1, section: 1 });
StudentSchema.index({ tenantId: 1, status: 1 });
StudentSchema.index({ tenantId: 1, "parent.fatherPhone": 1 });

export const Student = mongoose.model<IStudent>("Student", StudentSchema);
