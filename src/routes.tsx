import * as React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Chatbot from '@/pages/chatbot-page/Chatbot'
import CoursesPage from '@/pages/courses-page/CoursesPage'
import CourseDetailPage from '@/pages/courses-page/CourseDetailPage'
import ModulePage from '@/pages/courses-page/ModulePage'
import FinalExamPage from '@/pages/courses-page/FinalExamPage'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminCourses from '@/pages/admin/AdminCourses'

const router = createBrowserRouter([
  {
    element: <MainLayout />, children: [
      { path: '/', element: <Chatbot /> },
      { path: '/courses', element: <CoursesPage /> },
      { path: '/courses/:id', element: <CourseDetailPage /> },
      { path: '/courses/:id/modules/:moduleId', element: <ModulePage /> },
      { path: '/courses/:id/exam', element: <FinalExamPage /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/courses', element: <AdminCourses /> },
    ]
  }
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}