"use client";
import { useGetDashboardStatsQuery, useGetRevenueChartQuery, useGetEnrollmentTrendsQuery, useGetDashboardAlertsQuery } from "@/store/api/allApis";
import { Users, GraduationCap, CreditCard, ClipboardList, TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, trend, color }: {
  label: string; value: string | number; icon: React.ElementType;
  trend?: { value: number; positive: boolean }; color: string;
}) {
  return (
    <div className="stat-card flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {trend && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend.positive ? "text-emerald-600" : "text-destructive")}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value}% from last month</span>
          </div>
        )}
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function AlertBanner({ type, title, message }: { type: string; title: string; message: string }) {
  const styles = {
    warning: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800", icon: AlertTriangle, iconColor: "text-amber-600" },
    info: { bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800", icon: Info, iconColor: "text-blue-600" },
    success: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800", icon: CheckCircle2, iconColor: "text-emerald-600" },
  };
  const s = styles[type as keyof typeof styles] || styles.info;
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border text-sm", s.bg)}>
      <s.icon className={cn("w-4 h-4 mt-0.5 shrink-0", s.iconColor)} />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{message}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: revenueData } = useGetRevenueChartQuery(undefined);
  const { data: enrollmentData } = useGetEnrollmentTrendsQuery();
  const { data: alertsData } = useGetDashboardAlertsQuery();

  const stats = statsData?.data as Record<string, unknown>;
  const fees = stats?.fees as Record<string, number> | undefined;
  const attendance = stats?.attendance as Record<string, number> | undefined;
  const leads = stats?.leads as Record<string, number> | undefined;

  const statCards = [
    {
      label: "Total Students",
      value: statsLoading ? "—" : (stats?.totalStudents as number) ?? 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
      trend: { value: 8, positive: true },
    },
    {
      label: "Teachers",
      value: statsLoading ? "—" : (stats?.totalTeachers as number) ?? 0,
      icon: GraduationCap,
      color: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      label: "Fee Collected",
      value: statsLoading ? "—" : `₹${((fees?.totalCollected ?? 0) / 1000).toFixed(0)}K`,
      icon: CreditCard,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
      trend: { value: 12, positive: true },
    },
    {
      label: "Today's Attendance",
      value: statsLoading ? "—" : `${attendance?.percentage ?? 0}%`,
      icon: ClipboardList,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening at your school today.</p>
      </div>

      {/* Alerts */}
      {alertsData?.data && alertsData.data.length > 0 && (
        <div className="space-y-2">
          {(alertsData.data as { type: string; title: string; message: string }[]).map((a, i) => (
            <AlertBanner key={i} {...a} />
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="stat-card">
          <h3 className="font-semibold mb-1">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground mb-4">Billed vs Collected this year</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={(revenueData?.data as unknown[]) ?? []}>
              <defs>
                <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
              <Legend />
              <Area type="monotone" dataKey="billed" stroke="#6366f1" fill="url(#colorBilled)" strokeWidth={2} name="Billed" />
              <Area type="monotone" dataKey="collected" stroke="#10b981" fill="url(#colorCollected)" strokeWidth={2} name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollment Chart */}
        <div className="stat-card">
          <h3 className="font-semibold mb-1">Enrollment Trends</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly admissions this academic year</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(enrollmentData?.data as unknown[]) ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="admissions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Admissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Fee summary */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Fee Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Collected", value: fees?.totalCollected ?? 0, color: "text-emerald-600" },
              { label: "Total Pending", value: fees?.totalPending ?? 0, color: "text-orange-600" },
              { label: "Overdue Count", value: `${fees?.overdueCount ?? 0} students`, color: "text-destructive", raw: true },
            ].map(({ label, value, color, raw }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={cn("text-sm font-semibold", color)}>
                  {raw ? value : `₹${Number(value).toLocaleString("en-IN")}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Today's Attendance</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${attendance?.percentage ?? 0} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{attendance?.percentage ?? 0}%</span>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            {[
              { label: "Present", value: attendance?.present ?? 0, color: "text-emerald-600" },
              { label: "Absent", value: attendance?.absent ?? 0, color: "text-destructive" },
              { label: "Late", value: attendance?.late ?? 0, color: "text-orange-600" },
              { label: "Total", value: attendance?.total ?? 0, color: "text-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/50 rounded-lg p-2">
                <p className={cn("font-bold text-lg", color)}>{value}</p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admissions */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Admissions Pipeline</h3>
          <div className="space-y-3">
            {[
              { label: "New Enquiries", value: leads?.newLeads ?? 0, color: "bg-blue-500" },
              { label: "In Progress", value: 0, color: "bg-orange-500" },
              { label: "Converted (30d)", value: leads?.recentAdmissions ?? 0, color: "bg-emerald-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="flex-1 text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <a href="/dashboard/admissions" className="mt-4 block text-center text-sm text-primary hover:underline">
            View all leads →
          </a>
        </div>
      </div>
    </div>
  );
}
