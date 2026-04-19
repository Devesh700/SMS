import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import Cookies from "js-cookie";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token =
        (getState() as RootState).auth.token || Cookies.get("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Student",
    "Teacher",
    "Class",
    "Fee",
    "FeeInvoice",
    "Attendance",
    "Admission",
    "Notification",
    "Dashboard",
    "Tenant",
    "Communication",
  ],
  endpoints: () => ({}),
});
