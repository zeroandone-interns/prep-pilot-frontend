// src/store/coursesApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Course } from "@/types/course";

export const coursesApi = createApi({
  reducerPath: "coursesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }), // TODO: change to your backend origin
  tagTypes: ["Course"],
  endpoints: (builder) => ({
    getCourses: builder.query<Course[], void>({
      query: () => "/courses",
      providesTags: (res) => res ? [ ...res.map((c) => ({ type: "Course" as const, id: c.id })), { type: "Course" as const, id: "LIST" } ] : [{ type: "Course", id: "LIST" }],
    }),
    getCourseById: builder.query<Course, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (res, _e, id) => [{ type: "Course", id }],
    }),
  }),
});

export const { useGetCoursesQuery, useGetCourseByIdQuery } = coursesApi;