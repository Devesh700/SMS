import { FastifyRequest, FastifyReply } from "fastify";
import { UserRole } from "../types/enums";

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    request.user = request.user as JWTPayload;
  } catch (err) {
    reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Insufficient permissions for this action",
      });
    }
  };
}

export function tenantGuard() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantIdFromParam = (request.params as { tenantId?: string }).tenantId;
    if (
      request.user.role !== UserRole.SUPER_ADMIN &&
      tenantIdFromParam &&
      request.user.tenantId !== tenantIdFromParam
    ) {
      return reply.status(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Cross-tenant access is not allowed",
      });
    }
  };
}
