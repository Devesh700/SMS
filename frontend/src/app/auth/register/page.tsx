"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRegisterMutation } from "@/store/api/authApi";
import toast from "react-hot-toast";

const schema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  slug: z
    .string()
    .min(2, "School ID must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  contactPhone: z.string().min(10, "Contact phone is required"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [registerTenant, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerTenant(data).unwrap();
      toast.success("School registered! You can now sign in.");
      router.push(`/auth/login?school=${encodeURIComponent(data.slug)}`);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Registration failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <span className="text-xl font-bold">SchoolSaaS</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Start your school&apos;s 30-day free trial.
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Create your school workspace and invite your team in minutes.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[["10K+", "Students"], ["500+", "Schools"], ["99.9%", "Uptime"]].map(
            ([val, label]) => (
              <div key={label} className="bg-primary-foreground/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-sm text-primary-foreground/70">{label}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">SchoolSaaS</span>
            </div>
            <h2 className="text-2xl font-bold">Register your school</h2>
            <p className="text-muted-foreground mt-1">
              Create a school workspace and admin account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">School name</label>
              <input
                {...register("schoolName")}
                placeholder="Green Valley High School"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              {errors.schoolName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.schoolName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">School ID</label>
              <input
                {...register("slug")}
                placeholder="green-valley"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and hyphens only.
              </p>
              {errors.slug && (
                <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Admin name</label>
              <input
                {...register("adminName")}
                placeholder="Priya Sharma"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              {errors.adminName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.adminName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Admin email</label>
              <input
                {...register("adminEmail")}
                type="email"
                placeholder="admin@school.com"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              {errors.adminEmail && (
                <p className="text-destructive text-xs mt-1">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Admin password</label>
              <div className="relative">
                <input
                  {...register("adminPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.adminPassword && (
                <p className="text-destructive text-xs mt-1">
                  {errors.adminPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Contact phone</label>
              <input
                {...register("contactPhone")}
                type="tel"
                placeholder="9876543210"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              {errors.contactPhone && (
                <p className="text-destructive text-xs mt-1">
                  {errors.contactPhone.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Creating school..." : "Create school"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
