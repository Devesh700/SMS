"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateStudentMutation } from "@/store/api/studentsApi";
import { useGetClassesQuery } from "@/store/api/allApis";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.string().optional(),
  classId: z.string().min(1, "Class required"),
  section: z.string().min(1, "Section required"),
  admissionDate: z.string().min(1, "Admission date required"),
  fatherName: z.string().min(2, "Father name required"),
  fatherPhone: z.string().min(10, "Valid phone required"),
  fatherEmail: z.string().email().optional().or(z.literal("")),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  previousSchool: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function FormField({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition";

export default function NewStudentPage() {
  const router = useRouter();
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const { data: classesData } = useGetClassesQuery();
  const classes = (classesData?.data ?? []) as { _id: string; name: string; sections: string[] }[];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { admissionDate: new Date().toISOString().split("T")[0] },
  });

  const selectedClassId = watch("classId");
  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const onSubmit = async (data: FormData) => {
    try {
      await createStudent({
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        classId: data.classId,
        section: data.section,
        admissionDate: data.admissionDate,
        parent: {
          fatherName: data.fatherName,
          fatherPhone: data.fatherPhone,
          fatherEmail: data.fatherEmail || undefined,
          motherName: data.motherName,
          motherPhone: data.motherPhone,
        },
        address: { street: data.street, city: data.city, state: data.state, pincode: data.pincode },
        previousSchool: data.previousSchool,
        notes: data.notes,
      }).unwrap();
      toast.success("Student added successfully!");
      router.push("/dashboard/students");
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || "Failed to add student");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/students" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="page-header mb-0">
          <h1 className="page-title">Add New Student</h1>
          <p className="page-subtitle">Fill in the student details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" error={errors.name?.message} required>
              <input {...register("name")} placeholder="e.g. Rahul Sharma" className={inputCls} />
            </FormField>
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message} required>
              <input {...register("dateOfBirth")} type="date" className={inputCls} />
            </FormField>
            <FormField label="Gender" error={errors.gender?.message} required>
              <select {...register("gender")} className={inputCls}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Blood Group" error={errors.bloodGroup?.message}>
              <select {...register("bloodGroup")} className={inputCls}>
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </FormField>
          </div>
        </section>

        {/* Academic Info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Academic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Class" error={errors.classId?.message} required>
              <select {...register("classId")} className={inputCls}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Section" error={errors.section?.message} required>
              <select {...register("section")} className={inputCls} disabled={!selectedClass}>
                <option value="">Select section</option>
                {selectedClass?.sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Admission Date" error={errors.admissionDate?.message} required>
              <input {...register("admissionDate")} type="date" className={inputCls} />
            </FormField>
          </div>
          <FormField label="Previous School" error={errors.previousSchool?.message}>
            <input {...register("previousSchool")} placeholder="Previous school name (optional)" className={inputCls} />
          </FormField>
        </section>

        {/* Parent Info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Parent / Guardian Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Father's Name" error={errors.fatherName?.message} required>
              <input {...register("fatherName")} placeholder="Father's full name" className={inputCls} />
            </FormField>
            <FormField label="Father's Phone" error={errors.fatherPhone?.message} required>
              <input {...register("fatherPhone")} placeholder="10-digit mobile number" className={inputCls} />
            </FormField>
            <FormField label="Father's Email" error={errors.fatherEmail?.message}>
              <input {...register("fatherEmail")} type="email" placeholder="father@email.com" className={inputCls} />
            </FormField>
            <FormField label="Mother's Name" error={errors.motherName?.message}>
              <input {...register("motherName")} placeholder="Mother's full name" className={inputCls} />
            </FormField>
            <FormField label="Mother's Phone" error={errors.motherPhone?.message}>
              <input {...register("motherPhone")} placeholder="Mother's mobile number" className={inputCls} />
            </FormField>
          </div>
        </section>

        {/* Address */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Street Address">
                <input {...register("street")} placeholder="House/Flat no., Street name" className={inputCls} />
              </FormField>
            </div>
            <FormField label="City"><input {...register("city")} placeholder="City" className={inputCls} /></FormField>
            <FormField label="State"><input {...register("state")} placeholder="State" className={inputCls} /></FormField>
            <FormField label="PIN Code"><input {...register("pincode")} placeholder="PIN Code" className={inputCls} /></FormField>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-card border border-border rounded-xl p-6">
          <FormField label="Additional Notes">
            <textarea {...register("notes")} rows={3} placeholder="Any additional notes about this student..." className={inputCls} />
          </FormField>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/dashboard/students" className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isLoading ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
