// routes.tsx
import * as React from "react";
import SectionPage from "./pages/courses-page/SectionPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Chatbot from "@/pages/chatbot-page/ChatBot";
import CoursesPage from "@/pages/courses-page/CoursesPage";
import CourseDetailPage from "@/pages/courses-page/CourseDetailPage";
import ModulePage from "@/pages/courses-page/ModulePage";
import FinalExamPage from "@/pages/courses-page/FinalExamPage";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import SignUp from "@/pages/signin/Signup";
import EmailVerification from "@/pages/signin/EmailVerification";
import CreatePassword from "@/pages/signin/CreatePassword";
import CreateCoursePage from "@/pages/admin/CreateCoursePage";
import OrganizationPage from "@/pages/superadmin/OrganizationPage";
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminViewCourse from "./pages/admin/AdminViewCourse";
const router = createBrowserRouter([
  // Routes without navbar (outside MainLayout)
  { path: "/", element: <SignUp /> },
  { path: "/email-verification", element: <EmailVerification /> },
  { path: "/create-password", element: <CreatePassword /> },

  // Routes with navbar (inside MainLayout)
  {
    element: <MainLayout />,
    children: [
      {
        path: "/chatbot",
        element: (
          <ProtectedRoute>
            <Chatbot />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses",
        element: (
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses/:id",
        element: (
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses/:id/modules/:moduleId",
        element: (
          <ProtectedRoute>
            <ModulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses/:id/exam",
        element: (
          <ProtectedRoute>
            <FinalExamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/courses",
        element: (
          <ProtectedRoute>
            <AdminCourses />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/courses/new",
        element: (
          <ProtectedRoute>
            <CreateCoursePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/course/:courseId",
        element: (
          <ProtectedRoute>
            <AdminViewCourse />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses/:id/modules/:moduleId/sections/:sectionId",
        element: (
          <ProtectedRoute>
            <SectionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "organizations",
        element: (
          <ProtectedRoute>
            <OrganizationPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
