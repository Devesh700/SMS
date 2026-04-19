import { apiSlice } from "./apiSlice";

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    plan: string;
    primaryColor?: string;
  };
}

export interface RegisterTenantRequest {
  schoolName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  contactPhone: string;
}

export interface RegisterTenantResponse {
  tenantId: string;
  slug: string;
  adminId: string;
  message: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      { success: boolean; data: RegisterTenantResponse },
      RegisterTenantRequest
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<{ success: boolean; data: LoginResponse }, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getMe: builder.query<{ success: boolean; data: LoginResponse["user"] }, void>({
      query: () => "/auth/me",
    }),
    refreshToken: builder.mutation<{ success: boolean; data: { accessToken: string } }, { refreshToken: string }>({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
    }),
    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useChangePasswordMutation,
} = authApi;
