import { FastifyInstance } from "fastify";
import { User } from "../../models/user.model";
import { Tenant } from "../../models/tenant.model";
import { UserRole, SubscriptionPlan, TenantStatus } from "../../types/enums";
import { AppError } from "../../utils/errors";
// import { generateId } from "../../utils/helpers";
import { getRedisClient } from "../../config/redis";
import logger from "@/utils/logger";

export class AuthService {
  async registerTenant(data: {
    schoolName: string;
    slug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    contactPhone: string;
  }) {
    const existingTenant = await Tenant.findOne({ slug: data.slug });
    logger.info(`Existing tenant: ${existingTenant}`);
    if (existingTenant) throw new AppError("School slug already taken", 400);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const tenant = await Tenant.create({
      name: data.schoolName,
      slug: data.slug,
      contactEmail: data.adminEmail,
      contactPhone: data.contactPhone,
      plan: SubscriptionPlan.BASIC,
      status: TenantStatus.TRIAL,
      trialEndsAt: trialEnd,
    });

    logger.info(`New tenant created: ${tenant._id}`);

    const admin = await User.create({
      tenantId: tenant._id,
      name: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword,
      role: UserRole.SCHOOL_ADMIN,
    });

    logger.info(`New admin created: ${admin._id}`);

    return {
      tenantId: tenant._id,
      slug: tenant.slug,
      adminId: admin._id,
      message: "School registered successfully. Trial period: 30 days.",
    };
  }

  async login(
    data: { email: string; password: string; tenantSlug: string },
    fastify: FastifyInstance
  ) {
    const tenant = await Tenant.findOne({ slug: data.tenantSlug });
    if (!tenant) throw new AppError("School not found", 404);
    if (tenant.status === TenantStatus.SUSPENDED)
      throw new AppError("School account is suspended", 403);

    const user = await User.findOne({
      email: data.email,
      tenantId: tenant._id,
      isActive: true,
    }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);

    const isValid = await user.comparePassword(data.password);
    if (!isValid) throw new AppError("Invalid credentials", 401);

    const payload = {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = fastify.jwt.sign(payload);
    const refreshToken = fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    // Store refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        plan: tenant.plan,
        primaryColor: tenant.primaryColor,
      },
    };
  }

  async refreshToken(token: string, fastify: FastifyInstance) {
    try {
      const payload = fastify.jwt.verify(token) as {
        userId: string;
        tenantId: string;
        role: UserRole;
        email: string;
      };

      const user = await User.findById(payload.userId).select("+refreshToken");
      if (!user || user.refreshToken !== token)
        throw new AppError("Invalid refresh token", 401);

      const newPayload = {
        userId: user._id.toString(),
        tenantId: payload.tenantId,
        role: user.role,
        email: user.email,
      };
      const accessToken = fastify.jwt.sign(newPayload);
      return { accessToken };
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  async getMe(userId: string) {
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404);

    const isValid = await user.comparePassword(data.currentPassword);
    if (!isValid) throw new AppError("Current password is incorrect", 400);

    user.password = data.newPassword;
    await user.save();
  }
}
