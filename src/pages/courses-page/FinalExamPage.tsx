// src/pages/courses-page/FinalExamPage.tsx
import * as React from "react"
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom"
import { useAppSelector } from "@/store"
import { Box, Breadcrumbs, Link, Typography, Divider, Button, Alert } from "@mui/material"
import Quiz from "@/components/Quiz"

export default function FinalExamPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const course = useAppSelector((s) => s.courses.items.find((c) => c.id === id))
  const exam = course?.finalExam

  const [result, setResult] = React.useState<{ score: number; total: number } | null>(null)

  if (!course || !exam) return <Typography>Final exam not found.</Typography>

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">Courses</Link>
        <Link component={RouterLink} to={`/courses/${course.id}`} underline="hover">{course.title}</Link>
        <Typography color="text.primary">Final Exam</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>{exam.title}</Typography>
      <Divider sx={{ mb: 2 }} />

      <Quiz
        questions={exam.questions}
        onSubmit={(score, total) => {
          setResult({ score, total })
          // TODO: POST exam result to backend
        }}
      />

      {result && (
        <Alert sx={{ mt: 2 }} severity={result.score === result.total ? "success" : "info"}>
          Final Score: {result.score}/{result.total}
        </Alert>
      )}

      <Button sx={{ mt: 2 }} onClick={() => navigate(`/courses/${course.id}`)}>
        Back to course
      </Button>
    </Box>
  )
}
