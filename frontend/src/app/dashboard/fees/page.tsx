"use client";
import { useState } from "react";
import { useGetInvoicesQuery, useGetDefaultersQuery, useGetRevenueAnalyticsQuery, useSendFeeReminderMutation, useRecordPaymentMutation } from "@/store/api/allApis";
import { CreditCard, AlertCircle, TrendingUp, Send, DollarSign, Clock, CheckCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  waived: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const statusIcons = {
  pending: Clock, paid: CheckCircle, partial: DollarSign, overdue: AlertCircle, waived: CheckCircle,
};

type Tab = "invoices" | "defaulters" | "analytics";

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("invoices");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ id: string; balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const { data: invoicesData, isLoading } = useGetInvoicesQuery({ page: String(page), ...(statusFilter && { status: statusFilter }) });
  const { data: defaultersData } = useGetDefaultersQuery();
  const { data: analyticsData } = useGetRevenueAnalyticsQuery(undefined);
  const [sendReminder, { isLoading: reminderLoading }] = useSendFeeReminderMutation();
  const [recordPayment, { isLoading: paymentLoading }] = useRecordPaymentMutation();

  const invoices = (invoicesData?.data as { invoices: unknown[]; pagination: Record<string, number> } | undefined);
  const defaulters = defaultersData?.data ?? [];
  const analytics = analyticsData?.data as { totals?: Record<string, number> } | undefined;

  const handleReminder = async (id: string) => {
    try {
      await sendReminder(id).unwrap();
      toast.success("Fee reminder queued successfully!");
    } catch {
      toast.error("Failed to send reminder");
    }
    setOpenMenu(null);
  };

  const handlePayment = async () => {
    if (!paymentModal || !paymentAmount) return;
    try {
      await recordPayment({ id: paymentModal.id, body: { amount: parseFloat(paymentAmount), method: paymentMethod } }).unwrap();
      toast.success("Payment recorded!");
      setPaymentModal(null);
      setPaymentAmount("");
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "invoices", label: "All Invoices", icon: CreditCard },
    { id: "defaulters", label: `Defaulters (${(defaulters as unknown[]).length})`, icon: AlertCircle },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
        <p className="page-subtitle">Track fee collection, defaulters and revenue analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Collected", value: analytics?.totals?.totalCollected ?? 0, color: "text-emerald-600", icon: CheckCircle },
          { label: "Total Pending", value: analytics?.totals?.totalPending ?? 0, color: "text-orange-600", icon: Clock },
          { label: "Total Billed", value: analytics?.totals?.totalBilled ?? 0, color: "text-blue-600", icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card flex items-center gap-4">
            <div className={cn("p-3 rounded-xl bg-muted", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">₹{Number(value).toLocaleString("en-IN")}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div>
          <div className="flex gap-3 mb-4">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Status</option>
              {["pending", "paid", "partial", "overdue", "waived"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Invoice #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : (invoices?.invoices ?? []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No invoices found.</td></tr>
                ) : (
                  (invoices?.invoices ?? []).map((inv: unknown) => {
                    const invoice = inv as { _id: string; invoiceNumber: string; studentId: { name: string; studentId: string } | null; netAmount: number; paidAmount: number; balanceAmount: number; dueDate: string; status: string };
                    const StatusIcon = statusIcons[invoice.status as keyof typeof statusIcons] || Clock;
                    return (
                      <tr key={invoice._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium">{invoice.studentId?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{invoice.studentId?.studentId ?? ""}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">₹{invoice.netAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600">₹{invoice.paidAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm font-medium text-orange-600">₹{invoice.balanceAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[invoice.status])}>
                            <StatusIcon className="w-3 h-3" />{invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block">
                            <button onClick={() => setOpenMenu(openMenu === invoice._id ? null : invoice._id)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenu === invoice._id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                                {invoice.status !== "paid" && (
                                  <button onClick={() => { setOpenMenu(null); setPaymentModal({ id: invoice._id, balance: invoice.balanceAmount }); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                                    <DollarSign className="w-3.5 h-3.5" /> Record Payment
                                  </button>
                                )}
                                <button onClick={() => handleReminder(invoice._id)} disabled={reminderLoading} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                                  <Send className="w-3.5 h-3.5" /> Send Reminder
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Defaulters Tab */}
      {activeTab === "defaulters" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {(defaulters as unknown[]).length} students with overdue fees
            </p>
          </div>
          <table className="data-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Overdue Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Due Since</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Parent Phone</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(defaulters as unknown[]).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No defaulters! 🎉</td></tr>
              ) : (
                (defaulters as unknown[]).map((d: unknown) => {
                  const def = d as { _id: string; invoiceNumber: string; balanceAmount: number; dueDate: string; studentId: { name: string; studentId: string; parent: { fatherPhone: string } } | null };
                  return (
                    <tr key={def._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{def.studentId?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{def.studentId?.studentId}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{def.invoiceNumber}</td>
                      <td className="px-4 py-3 text-sm font-bold text-destructive">₹{def.balanceAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(def.dueDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${def.studentId?.parent?.fatherPhone}`} className="text-sm text-primary hover:underline">{def.studentId?.parent?.fatherPhone}</a>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleReminder(def._id)} className="flex items-center gap-1.5 ml-auto text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                          <Send className="w-3 h-3" /> Remind
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold mb-1">Record Payment</h3>
            <p className="text-sm text-muted-foreground mb-4">Balance due: ₹{paymentModal.balance.toLocaleString("en-IN")}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} max={paymentModal.balance} placeholder="Enter amount" className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {["cash", "online", "bank_transfer", "cheque", "upi"].map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handlePayment} disabled={paymentLoading || !paymentAmount} className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {paymentLoading ? "Saving..." : "Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
