import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  dateOfBirth?: Date;
  gender: "male" | "female" | "other";
  qualification: string;
  experience: number; // years
  subjects: string[];
  classesAssigned: {
    classId: mongoose.Types.ObjectId;
    section: string;
    isClassTeacher: boolean;
  }[];
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  joiningDate: Date;
  salary?: number;
  isActive: boolean;
  leaves: {
    date: Date;
    reason: string;
    status: "pending" | "approved" | "rejected";
    approvedBy?: mongoose.Types.ObjectId;
  }[];
  documents: {
    type: string;
    url: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    photo: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    qualification: { type: String, required: true },
    experience: { type: Number, default: 0 },
    subjects: [String],
    classesAssigned: [
      {
        classId: { type: Schema.Types.ObjectId, ref: "Class" },
        section: String,
        isClassTeacher: { type: Boolean, default: false },
      },
    ],
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    joiningDate: { type: Date, required: true },
    salary: Number,
    isActive: { type: Boolean, default: true },
    leaves: [
      {
        date: Date,
        reason: String,
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    documents: [{ type: { type: String }, url: String }],
  },
  { timestamps: true }
);

TeacherSchema.index({ tenantId: 1, teacherId: 1 }, { unique: true });
TeacherSchema.index({ tenantId: 1, isActive: 1 });

export const Teacher = mongoose.model<ITeacher>("Teacher", TeacherSchema);
