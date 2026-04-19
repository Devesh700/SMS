import { Worker, Job } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { QueueName, JobName } from "../../types/enums";
import { EmailService } from "../../services/email.service";
import logger from "../../utils/logger";

export function emailWorker(connection: unknown, io: SocketIOServer) {
  const emailService = new EmailService();

  const worker = new Worker(
    QueueName.EMAIL,
    async (job: Job) => {
      logger.info(`Processing email job: ${job.name} [${job.id}]`);

      switch (job.name) {
        case JobName.SEND_EMAIL: {
          const { to, subject, body, html } = job.data;
          await emailService.sendEmail({ to, subject, text: body, html });
          logger.info(`Email sent to ${to}`);
          break;
        }
        default:
          logger.warn(`Unknown email job: ${job.name}`);
      }
    },
    {
      connection: connection as never,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Email job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err.message);
  });

  return worker;
}
