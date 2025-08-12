// src/pages/courses-page/SectionPage.tsx
import * as React from "react"
import { useParams, Link as RouterLink } from "react-router-dom"
import { useAppSelector } from "@/store"
import { Box, Typography, Breadcrumbs, Link, Divider } from "@mui/material"
import MediaBlock from "@/components/MediaBlock"
import Quiz from "@/components/Quiz"

export default function SectionPage() {
  const { id, moduleId, sectionId } = useParams()
  const course = useAppSelector((s) => s.courses.items.find((c) => c.id === id))
  const module = course?.modules.find((m) => m.id === moduleId)
  const section = module?.sections.find((sec) => sec.id === sectionId)

  if (!course || !module || !section) return <Typography>Section not found.</Typography>

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">Courses</Link>
        <Link component={RouterLink} to={`/courses/${course.id}`} underline="hover">{course.title}</Link>
        <Link component={RouterLink} to={`/courses/${course.id}/modules/${module.id}`} underline="hover">{module.title}</Link>
        <Typography color="text.primary">{section.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>{section.title}</Typography>
      <Divider sx={{ mb: 2 }} />

      {section.blocks.map((b, i) =>
        b.kind === "paragraph"
          ? <Typography key={i} sx={{ mb: 2 }}>{b.text}</Typography>
          : <MediaBlock key={i} media={b.media} />
      )}

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Section Quiz</Typography>
      <Quiz
        questions={section.quiz}
        onSubmit={(score, total) => {
          // TODO: mark section as completed in backend
          console.log("Section quiz submitted", { score, total })
        }}
      />
    </Box>
  )
}
