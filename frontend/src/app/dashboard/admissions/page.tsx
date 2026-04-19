"use client";
import { useState } from "react";
import { useGetAdmissionsQuery, useCreateAdmissionMutation, useUpdateAdmissionStatusMutation, useAddFollowUpMutation } from "@/store/api/allApis";
import { Plus, Phone, MessageSquare, User, Calendar, ChevronRight, CheckCircle, XCircle, Clock, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig = {
  new: { label: "New", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", icon: User },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400", icon: Phone },
  follow_up: { label: "Follow Up", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400", icon: Clock },
  converted: { label: "Converted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", icon: CheckCircle },
  dropped: { label: "Dropped", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", icon: XCircle },
};

type LeadStatus = keyof typeof statusConfig;

const STATUSES = Object.keys(statusConfig) as LeadStatus[];

export default function AdmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [showNewLead, setShowNewLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState("call");
  const [newLead, setNewLead] = useState({ studentName: "", parentName: "", parentPhone: "", appliedForClass: "", source: "walk-in", academicYear: "2024-25" });

  const { data, isLoading } = useGetAdmissionsQuery({ ...(statusFilter && { status: statusFilter }), limit: "50" });
  const [createAdmission, { isLoading: creating }] = useCreateAdmissionMutation();
  const [updateStatus] = useUpdateAdmissionStatusMutation();
  const [addFollowUp, { isLoading: followingUp }] = useAddFollowUpMutation();

  const leads = (data?.data as { leads: unknown[] } | undefined)?.leads ?? [];

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l: unknown) => (l as { status: string }).status === s);
    return acc;
  }, {} as Record<LeadStatus, unknown[]>);

  const handleCreateLead = async () => {
    if (!newLead.studentName || !newLead.parentPhone) return toast.error("Student name and parent phone are required");
    try {
      await createAdmission({ ...newLead }).unwrap();
      toast.success("Lead created!");
      setShowNewLead(false);
      setNewLead({ studentName: "", parentName: "", parentPhone: "", appliedForClass: "", source: "walk-in", academicYear: "2024-25" });
    } catch { toast.error("Failed to create lead"); }
  };

  const handleStatusUpdate = async (id: string, status: LeadStatus) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Lead moved to ${statusConfig[status].label}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleFollowUp = async (id: string) => {
    if (!followUpNotes) return toast.error("Notes are required");
    try {
      await addFollowUp({ id, body: { notes: followUpNotes, channel: followUpChannel } }).unwrap();
      toast.success("Follow-up recorded!");
      setSelectedLead(null);
      setFollowUpNotes("");
    } catch { toast.error("Failed to add follow-up"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Admissions CRM</h1>
          <p className="page-subtitle">Track and convert admission enquiries</p>
        </div>
        <button onClick={() => setShowNewLead(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUSES.map((s) => {
          const { label, color, icon: Icon } = statusConfig[s];
          const count = grouped[s]?.length ?? 0;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={cn("p-3 rounded-xl border text-left transition-all", statusFilter === s ? "border-primary shadow-sm" : "border-border hover:border-primary/50 bg-card")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", color)}>{label}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">leads</p>
            </button>
          );
        })}
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium">{leads.length} leads {statusFilter && `(${statusConfig[statusFilter].label})`}</p>
          {statusFilter && (
            <button onClick={() => setStatusFilter("")} className="text-xs text-primary hover:underline">Clear filter</button>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <User className="w-8 h-8 mx-auto mb-2" />
            <p>No leads found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leads.map((l: unknown) => {
              const lead = l as { _id: string; leadNumber: string; studentName: string; parentName: string; parentPhone: string; appliedForClass: string; status: LeadStatus; source: string; createdAt: string; followUps: unknown[] };
              const { color, icon: Icon } = statusConfig[lead.status] || statusConfig.new;
              return (
                <div key={lead._id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0 mt-0.5">
                        {lead.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{lead.studentName}</p>
                          <span className="text-xs text-muted-foreground font-mono">{lead.leadNumber}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.parentName} • {lead.appliedForClass}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <a href={`tel:${lead.parentPhone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Phone className="w-3 h-3" />{lead.parentPhone}
                          </a>
                          <a href={`https://wa.me/91${lead.parentPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                            <MessageSquare className="w-3 h-3" />WhatsApp
                          </a>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        {lead.followUps?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{lead.followUps.length} follow-ups recorded</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", color)}>
                        <Icon className="w-3 h-3" />{statusConfig[lead.status]?.label}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedLead(selectedLead === lead._id ? null : lead._id)}
                          className="px-2 py-1 text-xs border border-border rounded-lg hover:bg-accent transition-colors">
                          Follow Up
                        </button>
                        {lead.status !== "converted" && lead.status !== "dropped" && (
                          <button onClick={() => handleStatusUpdate(lead._id, lead.status === "new" ? "contacted" : lead.status === "contacted" ? "follow_up" : "converted")}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                            Next <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up inline form */}
                  {selectedLead === lead._id && (
                    <div className="mt-3 ml-12 p-3 bg-muted/50 rounded-xl border border-border space-y-2">
                      <div className="flex gap-2">
                        <select value={followUpChannel} onChange={(e) => setFollowUpChannel(e.target.value)}
                          className="px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
                          {["call", "whatsapp", "email", "in-person"].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)}
                          placeholder="Follow-up notes..."
                          className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                        <button onClick={() => handleFollowUp(lead._id)} disabled={followingUp}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60">
                          {followingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Add New Lead</h3>
            <div className="space-y-3">
              {[
                { label: "Student Name*", key: "studentName", placeholder: "Student's full name" },
                { label: "Parent Name", key: "parentName", placeholder: "Parent/Guardian name" },
                { label: "Parent Phone*", key: "parentPhone", placeholder: "10-digit mobile number" },
                { label: "Applied for Class*", key: "appliedForClass", placeholder: "e.g. Class 6, Class 10" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                  <input value={newLead[key as keyof typeof newLead]} onChange={(e) => setNewLead((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
                <select value={newLead.source} onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {["walk-in", "referral", "website", "social-media", "other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNewLead(false)} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handleCreateLead} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
