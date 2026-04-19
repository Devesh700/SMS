import "dotenv/config";
import Fastify from "fastify";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { initializeQueues } from "./queues";
import { setupSocketIO } from "./services/socket.service";
import logger from "./utils/logger";

const PORT = parseInt(process.env.PORT || "8000");

async function bootstrap() {
  const fastify = Fastify({
    logger: false,
    trustProxy: true,
  });

  fastify.addHook('onRequest', async (request, reply) => {
  // Your logic here
  console.log('Middleware-like logic executed');
});


  // Create HTTP server for Socket.IO
  const httpServer = createServer(fastify.server);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
    path: "/socket.io",
  });

  fastify.get("/", async () => "Hello, World!");

  // Make io accessible in fastify
  fastify.decorate("io", io);

  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Register Fastify plugins
    await registerPlugins(fastify);

    // Register all routes
    await registerRoutes(fastify);

    // Initialize BullMQ queues & workers
    await initializeQueues(io);

    // Setup Socket.IO handlers
    setupSocketIO(io);

    // Start server (listen once on the shared HTTP server)
    // httpServer.listen(PORT, "0.0.0.0");
    fastify.listen({ port: PORT, host: "0.0.0.0" });

    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  process.exit(0);
});

bootstrap();
