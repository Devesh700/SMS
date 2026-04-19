import mongoose, { Schema, Document } from "mongoose";
import { SubscriptionPlan, TenantStatus } from "../types/enums";

export interface ITenant extends Document {
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contactEmail: string;
  contactPhone: string;
  plan: SubscriptionPlan;
  status: TenantStatus;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  settings: {
    timezone: string;
    currency: string;
    language: string;
    academicYearStart: number;
    enableWhatsApp: boolean;
    enableSMS: boolean;
    enableEmail: boolean;
    autoFeeReminders: boolean;
    autoAttendanceAlerts: boolean;
  };
  usage: {
    totalStudents: number;
    totalTeachers: number;
    emailsSentThisMonth: number;
    whatsappSentThisMonth: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: String,
    primaryColor: { type: String, default: "#4F46E5" },
    secondaryColor: { type: String, default: "#7C3AED" },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.TRIAL,
    },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.TRIAL,
    },
    trialEndsAt: Date,
    subscriptionEndsAt: Date,
    settings: {
      timezone: { type: String, default: "Asia/Kolkata" },
      currency: { type: String, default: "INR" },
      language: { type: String, default: "en" },
      academicYearStart: { type: Number, default: 4 }, // April
      enableWhatsApp: { type: Boolean, default: false },
      enableSMS: { type: Boolean, default: false },
      enableEmail: { type: Boolean, default: true },
      autoFeeReminders: { type: Boolean, default: true },
      autoAttendanceAlerts: { type: Boolean, default: true },
    },
    usage: {
      totalStudents: { type: Number, default: 0 },
      totalTeachers: { type: Number, default: 0 },
      emailsSentThisMonth: { type: Number, default: 0 },
      whatsappSentThisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>("Tenant", TenantSchema);
