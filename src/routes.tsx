import * as React from 'react'
import SectionPage from './pages/courses-page/SectionPage'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Chatbot from '@/pages/chatbot-page/ChatBot'
import CoursesPage from '@/pages/courses-page/CoursesPage'
import CourseDetailPage from '@/pages/courses-page/CourseDetailPage'
import ModulePage from '@/pages/courses-page/ModulePage'
import FinalExamPage from '@/pages/courses-page/FinalExamPage'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminCourses from '@/pages/admin/AdminCourses'
import SignUp from '@/pages/signin/Signup'
import EmailVerification from '@/pages/signin/EmailVerification'
import CreatePassword from '@/pages/signin/CreatePassword'
import CreateCoursePage from '@/pages/admin/CreateCoursePage'
import OrganizationPage from '@/pages/superadmin/OrganizationPage'
const router = createBrowserRouter([
  // Routes without navbar (outside MainLayout)
  { path: '/', element: <SignUp /> },
  { path: '/email-verification', element: <EmailVerification /> },
  { path: '/create-password', element: <CreatePassword /> },

  // Routes with navbar (inside MainLayout)
  {
    element: <MainLayout />,
    children: [
      { path: '/chatbot', element: <Chatbot /> },
      { path: '/courses', element: <CoursesPage /> },
      { path: '/courses/:id', element: <CourseDetailPage /> },
      { path: '/courses/:id/modules/:moduleId', element: <ModulePage /> },
      { path: '/courses/:id/exam', element: <FinalExamPage /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/courses', element: <AdminCourses /> },
      { path: '/admin/courses/new', element: <CreateCoursePage /> },
      { path: '/courses/:id/modules/:moduleId/sections/:sectionId', element: <SectionPage /> },
      {path:'organizations', element:
  <OrganizationPage />
       },
    ],
  },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
