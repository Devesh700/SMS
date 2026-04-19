import { Worker, Job } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { QueueName, JobName } from "../../types/enums";
import { EmailService } from "../../services/email.service";
import { WhatsAppService } from "../../services/whatsapp.service";
import { Student } from "../../models/student.model";
import { FeeInvoice } from "../../models/fee.model";
import { Tenant } from "../../models/tenant.model";
import { Notification } from "../../models/notification.model";
import { NotificationType } from "../../types/enums";
import logger from "../../utils/logger";
import dayjs from "dayjs";

export function reminderWorker(connection: unknown, io: SocketIOServer) {
  const emailService = new EmailService();
  const waService = new WhatsAppService();

  const worker = new Worker(
    QueueName.REMINDERS,
    async (job: Job) => {
      logger.info(`Processing reminder job: ${job.name} [${job.id}]`);

      switch (job.name) {
        case JobName.FEE_REMINDER: {
          const { tenantId, invoiceId, studentName, amount, dueDate } = job.data;
          const invoice = await FeeInvoice.findById(invoiceId)
            .populate("studentId", "name parent")
            .lean();
          if (!invoice) break;

          const tenant = await Tenant.findById(tenantId).lean();
          const student = invoice.studentId as unknown as {
            name: string;
            parent: { fatherPhone: string; fatherEmail?: string };
          };

          const message = `Dear Parent, fee of ₹${amount} for ${student.name} is due on ${dayjs(dueDate).format("DD MMM YYYY")}. Please pay at the earliest. - ${tenant?.name}`;

          if (tenant?.settings.enableEmail && student.parent.fatherEmail) {
            await emailService.sendEmail({
              to: student.parent.fatherEmail,
              subject: `Fee Reminder - ${student.name}`,
              text: message,
            });
          }

          if (tenant?.settings.enableWhatsApp && student.parent.fatherPhone) {
            await waService.sendMessage(student.parent.fatherPhone, message);
          }

          await FeeInvoice.findByIdAndUpdate(invoiceId, {
            $inc: { remindersSent: 1 },
            lastReminderAt: new Date(),
          });

          // Emit real-time notification
          io.to(`tenant:${tenantId}`).emit("fee:reminder-sent", { invoiceId, studentName });
          break;
        }

        case JobName.ATTENDANCE_ALERT: {
          const { tenantId, studentId, date } = job.data;
          const student = await Student.findById(studentId).lean();
          if (!student) break;

          const tenant = await Tenant.findById(tenantId).lean();
          const message = `Dear Parent, ${student.name} was absent on ${dayjs(date).format("DD MMM YYYY")}. Please inform the school if there's a valid reason. - ${tenant?.name}`;

          if (tenant?.settings.enableEmail && student.parent.fatherEmail) {
            await emailService.sendEmail({
              to: student.parent.fatherEmail,
              subject: "Attendance Alert",
              text: message,
            });
          }

          if (tenant?.settings.enableWhatsApp && student.parent.fatherPhone) {
            await waService.sendMessage(student.parent.fatherPhone, message);
          }

          io.to(`tenant:${tenantId}`).emit("attendance:alert", { studentId, date });
          break;
        }

        case JobName.ADMISSION_FOLLOWUP: {
          const { tenantId, leadId, parentName, parentPhone, studentName } = job.data;
          const tenant = await Tenant.findById(tenantId).lean();
          const message = `Dear ${parentName}, thank you for your enquiry about admission for ${studentName}. We'd like to follow up. Please call us. - ${tenant?.name}`;

          if (tenant?.settings.enableWhatsApp && parentPhone) {
            await waService.sendMessage(parentPhone, message);
          }

          io.to(`tenant:${tenantId}`).emit("admission:followup", { leadId });
          break;
        }

        default:
          logger.warn(`Unknown reminder job: ${job.name}`);
      }
    },
    {
      connection: connection as never,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`Reminder job ${job?.id} failed:`, err.message);
  });

  return worker;
}
