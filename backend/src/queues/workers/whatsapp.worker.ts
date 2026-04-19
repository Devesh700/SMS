import { Worker, Job } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { QueueName, JobName } from "../../types/enums";
import { WhatsAppService } from "../../services/whatsapp.service";
import logger from "../../utils/logger";

export function whatsappWorker(connection: unknown, io: SocketIOServer) {
  const waService = new WhatsAppService();

  const worker = new Worker(
    QueueName.WHATSAPP,
    async (job: Job) => {
      logger.info(`Processing WhatsApp job: ${job.name} [${job.id}]`);

      switch (job.name) {
        case JobName.SEND_WHATSAPP: {
          const { to, message, tenantId } = job.data;
          await waService.sendMessage(to, message);
          logger.info(`WhatsApp message sent to ${to} [tenant: ${tenantId}]`);
          break;
        }
        default:
          logger.warn(`Unknown WhatsApp job: ${job.name}`);
      }
    },
    {
      connection: connection as never,
      concurrency: 3,
      limiter: { max: 10, duration: 1000 }, // 10 msgs/sec
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`WhatsApp job ${job?.id} failed:`, err.message);
  });

  return worker;
}
