import { apiSlice } from "./apiSlice";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{ success: boolean; data: Record<string, unknown> }, void>({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
    getRevenueChart: builder.query<{ success: boolean; data: unknown[] }, string | undefined>({
      query: (year) => ({ url: "/dashboard/revenue", params: year ? { year } : {} }),
      providesTags: ["Dashboard"],
    }),
    getEnrollmentTrends: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/dashboard/enrollment",
      providesTags: ["Dashboard"],
    }),
    getDashboardAlerts: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/dashboard/alerts",
      providesTags: ["Dashboard"],
    }),
    getRecentActivity: builder.query<{ success: boolean; data: Record<string, unknown> }, void>({
      query: () => "/dashboard/activity",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetEnrollmentTrendsQuery,
  useGetDashboardAlertsQuery,
  useGetRecentActivityQuery,
} = dashboardApi;

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const feesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFeeStructures: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/fees/structures",
      providesTags: ["Fee"],
    }),
    createFeeStructure: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/fees/structures", method: "POST", body }),
      invalidatesTags: ["Fee"],
    }),
    getInvoices: builder.query<{ success: boolean; data: Record<string, unknown> }, Record<string, string>>({
      query: (params) => ({ url: "/fees/invoices", params }),
      providesTags: ["FeeInvoice"],
    }),
    getInvoice: builder.query<{ success: boolean; data: Record<string, unknown> }, string>({
      query: (id) => `/fees/invoices/${id}`,
      providesTags: (_r, _e, id) => [{ type: "FeeInvoice", id }],
    }),
    createInvoice: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/fees/invoices", method: "POST", body }),
      invalidatesTags: ["FeeInvoice", "Dashboard"],
    }),
    recordPayment: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/fees/invoices/${id}/payment`, method: "POST", body }),
      invalidatesTags: ["FeeInvoice", "Dashboard"],
    }),
    getDefaulters: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/fees/defaulters",
      providesTags: ["FeeInvoice"],
    }),
    getRevenueAnalytics: builder.query<{ success: boolean; data: Record<string, unknown> }, string | undefined>({
      query: (year) => ({ url: "/fees/analytics", params: year ? { year } : {} }),
      providesTags: ["Fee"],
    }),
    sendFeeReminder: builder.mutation<void, string>({
      query: (id) => ({ url: `/fees/invoices/${id}/reminder`, method: "POST" }),
    }),
  }),
});

export const {
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation,
  useGetDefaultersQuery,
  useGetRevenueAnalyticsQuery,
  useSendFeeReminderMutation,
} = feesApi;

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    markAttendance: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/attendance/mark", method: "POST", body }),
      invalidatesTags: ["Attendance", "Dashboard"],
    }),
    getAttendance: builder.query<{ success: boolean; data: unknown[] }, Record<string, string>>({
      query: (params) => ({ url: "/attendance", params }),
      providesTags: ["Attendance"],
    }),
    getAttendanceReport: builder.query<{ success: boolean; data: Record<string, unknown> }, Record<string, string>>({
      query: (params) => ({ url: "/attendance/report", params }),
      providesTags: ["Attendance"],
    }),
    getTodayAbsentees: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/attendance/absentees/today",
      providesTags: ["Attendance"],
    }),
    getAttendanceAnalytics: builder.query<{ success: boolean; data: unknown[] }, Record<string, string>>({
      query: (params) => ({ url: "/attendance/analytics", params }),
      providesTags: ["Attendance"],
    }),
  }),
});

export const {
  useMarkAttendanceMutation,
  useGetAttendanceQuery,
  useGetAttendanceReportQuery,
  useGetTodayAbsenteesQuery,
  useGetAttendanceAnalyticsQuery,
} = attendanceApi;

// ─── Admissions ───────────────────────────────────────────────────────────────
export const admissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdmissions: builder.query<{ success: boolean; data: Record<string, unknown> }, Record<string, string>>({
      query: (params) => ({ url: "/admissions", params }),
      providesTags: ["Admission"],
    }),
    getAdmission: builder.query<{ success: boolean; data: Record<string, unknown> }, string>({
      query: (id) => `/admissions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Admission", id }],
    }),
    createAdmission: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/admissions", method: "POST", body }),
      invalidatesTags: ["Admission", "Dashboard"],
    }),
    updateAdmissionStatus: builder.mutation<unknown, { id: string; status: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/admissions/${id}/status`, method: "PATCH", body }),
      invalidatesTags: ["Admission"],
    }),
    addFollowUp: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admissions/${id}/followup`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Admission", id }],
    }),
    getAdmissionAnalytics: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/admissions/analytics/conversion",
      providesTags: ["Admission"],
    }),
  }),
});

export const {
  useGetAdmissionsQuery,
  useGetAdmissionQuery,
  useCreateAdmissionMutation,
  useUpdateAdmissionStatusMutation,
  useAddFollowUpMutation,
  useGetAdmissionAnalyticsQuery,
} = admissionsApi;

// ─── Communication ────────────────────────────────────────────────────────────
export const communicationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendBroadcast: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/communication/broadcast", method: "POST", body }),
    }),
    sendIndividual: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/communication/send", method: "POST", body }),
    }),
    getTemplates: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => "/communication/templates",
    }),
    getCommunicationLogs: builder.query<{ success: boolean; data: Record<string, unknown> }, Record<string, string>>({
      query: (params) => ({ url: "/communication/logs", params }),
      providesTags: ["Communication"],
    }),
    scheduleMessage: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/communication/schedule", method: "POST", body }),
    }),
  }),
});

export const {
  useSendBroadcastMutation,
  useSendIndividualMutation,
  useGetTemplatesQuery,
  useGetCommunicationLogsQuery,
  useScheduleMessageMutation,
} = communicationApi;

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<{ success: boolean; data: unknown[] }, Record<string, string> | void>({
      query: (params) => ({ url: "/classes", params: params || {} }),
      providesTags: ["Class"],
    }),
    getClass: builder.query<{ success: boolean; data: Record<string, unknown> }, string>({
      query: (id) => `/classes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Class", id }],
    }),
    createClass: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/classes", method: "POST", body }),
      invalidatesTags: ["Class"],
    }),
    updateClass: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/classes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Class"],
    }),
    updateTimetable: builder.mutation<unknown, { id: string; timetable: unknown[] }>({
      query: ({ id, timetable }) => ({ url: `/classes/${id}/timetable`, method: "PUT", body: { timetable } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Class", id }],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useUpdateTimetableMutation,
} = classesApi;

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query<{ success: boolean; data: Record<string, unknown> }, Record<string, string> | void>({
      query: (params) => ({ url: "/teachers", params: params || {} }),
      providesTags: ["Teacher"],
    }),
    getTeacher: builder.query<{ success: boolean; data: Record<string, unknown> }, string>({
      query: (id) => `/teachers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Teacher", id }],
    }),
    createTeacher: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/teachers", method: "POST", body }),
      invalidatesTags: ["Teacher"],
    }),
    updateTeacher: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/teachers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Teacher"],
    }),
    deleteTeacher: builder.mutation<void, string>({
      query: (id) => ({ url: `/teachers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Teacher"],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = teachersApi;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<{ success: boolean; data: { notifications: unknown[]; unreadCount: number } }, void>({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
} = notificationsApi;

// ─── Tenant ───────────────────────────────────────────────────────────────────
export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTenant: builder.query<{ success: boolean; data: Record<string, unknown> }, void>({
      query: () => "/tenants/me",
      providesTags: ["Tenant"],
    }),
    updateTenantSettings: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/tenants/settings", method: "PATCH", body }),
      invalidatesTags: ["Tenant"],
    }),
  }),
});

export const { useGetTenantQuery, useUpdateTenantSettingsMutation } = tenantApi;
