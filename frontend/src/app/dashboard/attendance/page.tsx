"use client";
import { useState } from "react";
import { useGetClassesQuery, useMarkAttendanceMutation, useGetAttendanceReportQuery, useGetTodayAbsenteesQuery } from "@/store/api/allApis";
import { useGetStudentsQuery } from "@/store/api/studentsApi";
import { CheckCircle, XCircle, Clock, MinusCircle, Save, Loader2, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  present: { label: "Present", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950" },
  absent: { label: "Absent", icon: XCircle, color: "text-destructive", bg: "bg-red-100 dark:bg-red-950" },
  late: { label: "Late", icon: Clock, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950" },
  half_day: { label: "Half Day", icon: MinusCircle, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
};

type Tab = "mark" | "absentees" | "report";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("mark");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [markAll, setMarkAll] = useState<AttendanceStatus | "">("");

  const { data: classesData } = useGetClassesQuery();
  const classes = (classesData?.data ?? []) as { _id: string; name: string; sections: string[] }[];
  const cls = classes.find((c) => c._id === selectedClass);

  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery(
    { classId: selectedClass, section: selectedSection, status: "active", limit: "100" },
    { skip: !selectedClass || !selectedSection }
  );
  const students = studentsData?.data?.students ?? [];

  const { data: absenteesData } = useGetTodayAbsenteesQuery();
  const absentees = (absenteesData?.data ?? []) as unknown[];

  const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();

  const currentYear = new Date().getFullYear();
  const academicYear = new Date().getMonth() >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

  const getStatus = (id: string): AttendanceStatus => attendanceMap[id] ?? "present";

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { newMap[s._id] = status; });
    setAttendanceMap(newMap);
    setMarkAll(status);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSection) return toast.error("Please select class and section");
    if (students.length === 0) return toast.error("No students found");
    try {
      const records = students.map((s) => ({ entityId: s._id, status: getStatus(s._id) }));
      await markAttendance({ date, classId: selectedClass, section: selectedSection, academicYear, records }).unwrap();
      toast.success("Attendance saved successfully!");
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  const summary = students.reduce((acc, s) => {
    const status = getStatus(s._id);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark and track student attendance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([["mark", "Mark Attendance"], ["absentees", "Today's Absentees"], ["report", "Report"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "mark" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Class</label>
                <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setAttendanceMap({}); }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Section</label>
                <select value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setAttendanceMap({}); }} disabled={!cls}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                  <option value="">Select section</option>
                  {cls?.sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          {selectedClass && selectedSection && (
            <>
              {/* Mark All & Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Mark all:</span>
                  {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                    const { label, icon: Icon, color, bg } = statusConfig[status];
                    return (
                      <button key={status} onClick={() => handleMarkAll(status)}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border", markAll === status ? `${bg} ${color} border-current` : "border-border hover:bg-accent")}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {Object.entries(summary).map(([status, count]) => (
                    <span key={status} className={cn("font-medium", statusConfig[status as AttendanceStatus]?.color)}>
                      {count} {status}
                    </span>
                  ))}
                </div>
              </div>

              {/* Student List */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Users className="w-8 h-8" /><p>No students in this class/section</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {students.map((student, idx) => {
                      const currentStatus = getStatus(student._id);
                      const { icon: Icon, color } = statusConfig[currentStatus];
                      return (
                        <div key={student._id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-sm text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.studentId} {student.rollNumber && `• Roll ${student.rollNumber}`}</p>
                          </div>
                          <Icon className={cn("w-4 h-4", color)} />
                          <div className="flex gap-1.5 shrink-0">
                            {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                              const { label, bg, color: sc } = statusConfig[status];
                              return (
                                <button key={status} onClick={() => setAttendanceMap((prev) => ({ ...prev, [student._id]: status }))}
                                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors border", currentStatus === status ? `${bg} ${sc} border-current` : "border-border text-muted-foreground hover:bg-accent")}
                                  title={label}
                                >
                                  {label[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving || students.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors text-sm font-medium">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : `Save Attendance (${students.length} students)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "absentees" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Today's Absentees — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <span className="ml-auto text-sm text-muted-foreground">{absentees.length} absent</span>
            </div>
          </div>
          {absentees.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p>No absentees today! Full attendance. 🎉</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {absentees.map((a: unknown, i) => {
                  const ab = a as { entityId?: { name: string; studentId: string; parent?: { fatherPhone: string } }; section: string };
                  return (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{ab.entityId?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{ab.entityId?.studentId}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{ab.section}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${ab.entityId?.parent?.fatherPhone}`} className="text-sm text-primary hover:underline">{ab.entityId?.parent?.fatherPhone ?? "—"}</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
