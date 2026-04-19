import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { authenticate } from "../../middleware/auth.middleware";
import logger from "@/utils/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1),
});

const registerTenantSchema = z.object({
  schoolName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  contactPhone: z.string().min(10),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // Register new school (tenant)
  fastify.post("/register", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = registerTenantSchema.parse(req.body);
    logger.info(`Registering new tenant: ${body}`);
    const result = await authService.registerTenant(body);
    return reply.status(201).send({ success: true, data: result });
  });

  // Login
  fastify.post("/login", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body, fastify);
    return reply.send({ success: true, data: result });
  });

  // Refresh token
  fastify.post("/refresh", async (req: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(refreshToken, fastify);
    return reply.send({ success: true, data: result });
  });

  // Logout
  fastify.post(
    "/logout",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      await authService.logout(req.user.userId);
      return reply.send({ success: true, message: "Logged out successfully" });
    }
  );

  // Get current user
  fastify.get(
    "/me",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = await authService.getMe(req.user.userId);
      return reply.send({ success: true, data: user });
    }
  );

  // Change password
  fastify.patch(
    "/change-password",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = z
        .object({ currentPassword: z.string(), newPassword: z.string().min(8) })
        .parse(req.body);
      await authService.changePassword(req.user.userId, body);
      return reply.send({ success: true, message: "Password changed successfully" });
    }
  );
}
