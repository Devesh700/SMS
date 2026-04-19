import { Queue, Worker, QueueEvents } from "bullmq";
import { Server as SocketIOServer } from "socket.io";
import { getRedisClient } from "../config/redis";
import { QueueName } from "../types/enums";
import { emailWorker } from "./workers/email.worker";
import { whatsappWorker } from "./workers/whatsapp.worker";
import { reminderWorker } from "./workers/reminder.worker";
import logger from "../utils/logger";

const queues: Map<string, Queue> = new Map();

export function getQueue(name: QueueName): Queue {
  const queue = queues.get(name);
  if (!queue) throw new Error(`Queue ${name} not initialized`);
  return queue;
}

export async function initializeQueues(io: SocketIOServer): Promise<void> {
  const connection = getRedisClient();

  const queueNames = Object.values(QueueName);
  for (const name of queueNames) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    queues.set(name, queue);
    logger.info(`Queue initialized: ${name}`);
  }

  // Start workers
  emailWorker(connection, io);
  whatsappWorker(connection, io);
  reminderWorker(connection, io);

  logger.info("✅ All BullMQ workers started");
}
