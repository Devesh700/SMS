"use client";
import { useState } from "react";
import { useGetStudentsQuery, useDeleteStudentMutation } from "@/store/api/studentsApi";
import { useGetClassesQuery } from "@/store/api/allApis";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit2, Trash2, Download, Upload, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  passed_out: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  suspended: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetStudentsQuery({
    page: String(page),
    limit: "20",
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  });

  const { data: classesData } = useGetClassesQuery();
  const [deleteStudent] = useDeleteStudentMutation();

  const students = data?.data?.students ?? [];
  const pagination = data?.data?.pagination;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Mark ${name} as dropped?`)) return;
    try {
      await deleteStudent(id).unwrap();
      toast.success(`${name} has been dropped`);
    } catch {
      toast.error("Failed to update student");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} students enrolled</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <Link
            href="/dashboard/students/new"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="passed_out">Passed Out</option>
          <option value="dropped">Dropped</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No students found. <Link href="/dashboard/students/new" className="text-primary hover:underline">Add the first student.</Link>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const cls = typeof student.classId === "object" ? student.classId : null;
                  return (
                    <tr key={student._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{student.studentId}</td>
                      <td className="px-4 py-3 text-sm">
                        {cls ? `${cls.name} – ${student.section}` : student.section}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{student.parent.fatherName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a href={`tel:${student.parent.fatherPhone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="w-3 h-3" />{student.parent.fatherPhone}
                          </a>
                          {student.parent.fatherEmail && (
                            <a href={`mailto:${student.parent.fatherEmail}`} className="text-muted-foreground hover:text-primary transition-colors">
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[student.status] || "bg-muted text-muted-foreground")}>
                          {student.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === student._id ? null : student._id)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === student._id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                              <Link href={`/dashboard/students/${student._id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors" onClick={() => setOpenMenu(null)}>
                                <Eye className="w-3.5 h-3.5" /> View
                              </Link>
                              <Link href={`/dashboard/students/${student._id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors" onClick={() => setOpenMenu(null)}>
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </Link>
                              <button onClick={() => { setOpenMenu(null); handleDelete(student._id, student.name); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Drop
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

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
