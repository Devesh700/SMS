export enum UserRole {
  SUPER_ADMIN = "super_admin",
  SCHOOL_ADMIN = "school_admin",
  TEACHER = "teacher",
  ACCOUNTANT = "accountant",
  STUDENT = "student",
  PARENT = "parent",
}

export enum StudentStatus {
  ACTIVE = "active",
  PASSED_OUT = "passed_out",
  DROPPED = "dropped",
  SUSPENDED = "suspended",
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  FOLLOW_UP = "follow_up",
  CONVERTED = "converted",
  DROPPED = "dropped",
}

export enum FeeStatus {
  PENDING = "pending",
  PAID = "paid",
  PARTIAL = "partial",
  OVERDUE = "overdue",
  WAIVED = "waived",
}

export enum PaymentMethod {
  CASH = "cash",
  ONLINE = "online",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
  UPI = "upi",
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  HALF_DAY = "half_day",
  HOLIDAY = "holiday",
}

export enum NotificationType {
  FEE_DUE = "fee_due",
  FEE_OVERDUE = "fee_overdue",
  ATTENDANCE_ALERT = "attendance_alert",
  EXAM_REMINDER = "exam_reminder",
  ADMISSION_UPDATE = "admission_update",
  GENERAL = "general",
  SYSTEM = "system",
}

export enum CommunicationChannel {
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  SMS = "sms",
  IN_APP = "in_app",
}

export enum SubscriptionPlan {
  TRIAL = "trial",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum TenantStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  TRIAL = "trial",
  EXPIRED = "expired",
}

export enum QueueName {
  EMAIL = "email-queue",
  WHATSAPP = "whatsapp-queue",
  SMS = "sms-queue",
  NOTIFICATIONS = "notifications-queue",
  REMINDERS = "reminders-queue",
  REPORTS = "reports-queue",
}

export enum JobName {
  SEND_EMAIL = "send-email",
  SEND_WHATSAPP = "send-whatsapp",
  SEND_SMS = "send-sms",
  FEE_REMINDER = "fee-reminder",
  ATTENDANCE_ALERT = "attendance-alert",
  ADMISSION_FOLLOWUP = "admission-followup",
  EXAM_NOTIFICATION = "exam-notification",
  DAILY_REPORT = "daily-report",
  GENERATE_INVOICE = "generate-invoice",
}
