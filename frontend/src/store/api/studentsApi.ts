import { apiSlice } from "./apiSlice";

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  photo?: string;
  classId: { _id: string; name: string } | string;
  section: string;
  rollNumber?: string;
  admissionDate: string;
  admissionNumber: string;
  status: string;
  address?: Record<string, string>;
  parent: {
    fatherName: string;
    fatherPhone: string;
    fatherEmail?: string;
    motherName?: string;
    motherPhone?: string;
  };
  createdAt: string;
}

export interface StudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}

export const studentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<StudentsResponse, Record<string, string>>({
      query: (params) => ({ url: "/students", params }),
      providesTags: ["Student"],
    }),
    getStudent: builder.query<{ success: boolean; data: Student }, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Student", id }],
    }),
    createStudent: builder.mutation<{ success: boolean; data: Student }, Partial<Student>>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Student", "Dashboard"],
    }),
    updateStudent: builder.mutation<{ success: boolean; data: Student }, { id: string; body: Partial<Student> }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Student", id }, "Student"],
    }),
    deleteStudent: builder.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Student", "Dashboard"],
    }),
    getStudentAttendance: builder.query<unknown, { id: string; month?: string; year?: string }>({
      query: ({ id, ...params }) => ({ url: `/students/${id}/attendance`, params }),
    }),
    getStudentFees: builder.query<unknown, string>({
      query: (id) => `/students/${id}/fees`,
      providesTags: (_r, _e, id) => [{ type: "FeeInvoice", id }],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentAttendanceQuery,
  useGetStudentFeesQuery,
} = studentsApi;
