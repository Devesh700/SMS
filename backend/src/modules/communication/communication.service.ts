import { Student } from "../../models/student.model";
import { Teacher } from "../../models/teacher.model";
import { CommunicationChannel, QueueName, JobName } from "../../types/enums";
import { getQueue } from "../../queues";
import mongoose from "mongoose";

export class CommunicationService {
  async sendBroadcast(
    tenantId: string,
    data: {
      title: string;
      message: string;
      channels: CommunicationChannel[];
      targetType: string;
      classId?: string;
      section?: string;
      studentIds?: string[];
    },
    sentBy: string
  ) {
    // Resolve recipients
    const recipients = await this.resolveRecipients(tenantId, data);

    const jobs = [];
    for (const recipient of recipients) {
      for (const channel of data.channels) {
        if (channel === CommunicationChannel.EMAIL && recipient.email) {
          jobs.push(
            getQueue(QueueName.EMAIL).add(JobName.SEND_EMAIL, {
              tenantId,
              to: recipient.email,
              subject: data.title,
              body: data.message,
              sentBy,
            })
          );
        }
        if (channel === CommunicationChannel.WHATSAPP && recipient.phone) {
          jobs.push(
            getQueue(QueueName.WHATSAPP).add(JobName.SEND_WHATSAPP, {
              tenantId,
              to: recipient.phone,
              message: `*${data.title}*\n\n${data.message}`,
              sentBy,
            })
          );
        }
      }
    }

    await Promise.all(jobs);
    return { queued: recipients.length * data.channels.length, recipients: recipients.length };
  }

  async sendIndividual(
    tenantId: string,
    data: {
      channel: CommunicationChannel;
      recipientId: string;
      recipientType: string;
      subject?: string;
      message: string;
    },
    sentBy: string
  ) {
    let recipient: { email?: string; phone?: string; name: string } | null = null;

    if (data.recipientType === "student") {
      const student = await Student.findOne({ _id: data.recipientId, tenantId }).lean();
      if (student) {
        recipient = {
          email: student.parent.fatherEmail,
          phone: student.parent.fatherPhone,
          name: student.name,
        };
      }
    } else if (data.recipientType === "teacher") {
      const teacher = await Teacher.findOne({ _id: data.recipientId, tenantId }).lean();
      if (teacher) {
        recipient = { email: teacher.email, phone: teacher.phone, name: teacher.name };
      }
    }

    if (!recipient) throw new Error("Recipient not found");

    if (data.channel === CommunicationChannel.EMAIL && recipient.email) {
      await getQueue(QueueName.EMAIL).add(JobName.SEND_EMAIL, {
        tenantId,
        to: recipient.email,
        subject: data.subject || "Message from School",
        body: data.message,
        sentBy,
      });
    } else if (data.channel === CommunicationChannel.WHATSAPP && recipient.phone) {
      await getQueue(QueueName.WHATSAPP).add(JobName.SEND_WHATSAPP, {
        tenantId,
        to: recipient.phone,
        message: data.message,
        sentBy,
      });
    }

    return { queued: true };
  }

  async getLogs(tenantId: string, query: Record<string, string>) {
    // In production, store in CommunicationLog collection
    return { logs: [], message: "Communication logs coming soon" };
  }

  async scheduleMessage(
    tenantId: string,
    data: {
      title: string;
      message: string;
      channels: CommunicationChannel[];
      scheduledAt: string;
      targetType: string;
      classId?: string;
      section?: string;
    },
    sentBy: string
  ) {
    const delay = new Date(data.scheduledAt).getTime() - Date.now();
    if (delay < 0) throw new Error("Scheduled time must be in the future");

    const queue = getQueue(QueueName.REMINDERS);
    await queue.add(
      "scheduled-broadcast",
      { tenantId, ...data, sentBy },
      { delay }
    );

    return { scheduled: true, scheduledAt: data.scheduledAt };
  }

  async getTemplates(tenantId: string) {
    return [
      {
        id: "fee-reminder",
        name: "Fee Reminder",
        subject: "Fee Payment Reminder",
        body: "Dear Parent, your fee of ₹{amount} for {studentName} is due on {dueDate}. Please pay at the earliest.",
        channels: ["email", "whatsapp"],
      },
      {
        id: "attendance-alert",
        name: "Attendance Alert",
        subject: "Attendance Alert",
        body: "Dear Parent, {studentName} was absent on {date}. Please inform the school if there is a valid reason.",
        channels: ["email", "whatsapp", "sms"],
      },
      {
        id: "exam-reminder",
        name: "Exam Reminder",
        subject: "Upcoming Exam",
        body: "Dear Parent, {studentName}'s {examName} exam is scheduled on {date}. Please ensure proper preparation.",
        channels: ["email", "whatsapp"],
      },
      {
        id: "admission-followup",
        name: "Admission Follow-up",
        subject: "Admission Enquiry Follow-up",
        body: "Dear {parentName}, thank you for your enquiry about admission for {studentName}. We would like to schedule a meeting. Please call us at {phone}.",
        channels: ["email", "whatsapp"],
      },
    ];
  }

  private async resolveRecipients(tenantId: string, data: {
    targetType: string;
    classId?: string;
    section?: string;
    studentIds?: string[];
  }) {
    const filter: Record<string, unknown> = { tenantId, status: "active" };
    if (data.targetType === "class" && data.classId) {
      filter.classId = new mongoose.Types.ObjectId(data.classId);
    }
    if (data.targetType === "section" && data.section) {
      filter.section = data.section;
    }
    if (data.targetType === "custom" && data.studentIds) {
      filter._id = { $in: data.studentIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const students = await Student.find(filter)
      .select("name parent.fatherEmail parent.fatherPhone parent.motherEmail parent.motherPhone")
      .lean();

    return students.map((s) => ({
      name: s.name,
      email: s.parent.fatherEmail || s.parent.motherEmail,
      phone: s.parent.fatherPhone || s.parent.motherPhone,
    }));
  }
}
