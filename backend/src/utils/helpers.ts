import mongoose from "mongoose";
import { Student } from "../models/student.model";

export async function generateStudentId(tenantId: string): Promise<string> {
  const count = await Student.countDocuments({ tenantId });
  const year = new Date().getFullYear().toString().slice(-2);
  return `STU${year}${String(count + 1).padStart(4, "0")}`;
}

export function generateReceiptNumber(): string {
  return `REC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateInvoiceNumber(tenantSlug: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${tenantSlug.toUpperCase()}-INV-${year}-${random}`;
}

export function paginate(page: number, limit: number): { skip: number; limit: number } {
  return { skip: (page - 1) * limit, limit };
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}
