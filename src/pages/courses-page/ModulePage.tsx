// src/pages/courses-page/ModulePage.tsx
import * as React from "react"
import { useParams, Link as RouterLink } from "react-router-dom"
import { useAppSelector } from "@/store"
import { Box, Typography, Breadcrumbs, Link, Divider, List, ListItem, ListItemButton, ListItemText } from "@mui/material"

export default function ModulePage() {
  const { id, moduleId } = useParams()
  const course = useAppSelector((s) => s.courses.items.find((c) => c.id === id))
  const module = course?.modules.find((m) => m.id === moduleId)

  if (!course || !module) return <Typography>Module not found.</Typography>

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">Courses</Link>
        <Link component={RouterLink} to={`/courses/${course.id}`} underline="hover">{course.title}</Link>
        <Typography color="text.primary">{module.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>{module.title}</Typography>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 1.5 }}>Sections</Typography>
      <List>
        {module.sections.map((s, idx) => (
          <ListItem key={s.id} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={`/courses/${course.id}/modules/${module.id}/sections/${s.id}`}
            >
              <ListItemText primary={`Section ${idx + 1}: ${s.title}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
