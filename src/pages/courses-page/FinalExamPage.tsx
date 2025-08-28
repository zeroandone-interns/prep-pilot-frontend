import * as React from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store";
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Divider,
  Button,
  Alert,
} from "@mui/material";
import Quiz from "@/components/Quiz";
import axios from "axios";
import type { MCQQuestion } from "@/types/course"; // your MCQQuestion type
import { useSelector } from "react-redux";
import { type RootState } from "@/store";

export default function FinalExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const course = useSelector((state: RootState) => state.course);
    const language = useSelector((state: RootState) => state.language);
    const lang = language.lang;


  const [questions, setQuestions] = React.useState<MCQQuestion[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    score: number;
    total: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!course) return;
    setLoading(true);
    setError(null);

    // Fetch questions from backend
    axios
      .get(`${BaseUrl}/courses/questions/${id}`)
      .then((res) => {
        // Map backend Questions to MCQQuestion format
        const data: MCQQuestion[] = res.data.map((q: any) => ({
          id: q.id.toString(),
          prompt: q[`question_text_${lang}` as keyof typeof q] ?? "", // or choose lang dynamically
          options: [
            {
              id: "1",
              text: q[`option1_${lang}` as keyof typeof q] ?? "",
            },
            {
              id: "2",
              text: q[`option2_${lang}` as keyof typeof q] ?? "",
            },
            {
              id: "3",
              text: q[`option3_${lang}` as keyof typeof q] ?? "",
            },
          ],
          correctOptionId: (() => {
            if (
              q[`correct_answer_${lang}` as keyof typeof q] ===
              q[`option1_${lang}` as keyof typeof q]
            )
              return "1";
            if (
              q[`correct_answer_${lang}` as keyof typeof q] ===
              q[`option2_${lang}` as keyof typeof q]
            )
              return "2";
            if (
              q[`correct_answer_${lang}` as keyof typeof q] ===
              q[`option3_${lang}` as keyof typeof q]
            )
              return "3";
            return "1"; // fallback
          })(),
        }));
        setQuestions(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load exam questions.");
      })
      .finally(() => setLoading(false));
  }, [course]);

  if (!course) return <Typography>Course not found.</Typography>;
  if (loading) return <Typography>Loading questions...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!questions || !questions.length)
    return <Typography>No questions for this exam.</Typography>;

  const total = questions.length;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">
          Courses
        </Link>
        <Link
          component={RouterLink}
          to={`/courses/${id}`}
          underline="hover"
        >
          {course.title}
        </Link>
        <Typography color="text.primary">Final Exam</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>
        Final Exam
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Quiz
        questions={questions}
        onSubmit={(score, total) => setResult({ score, total })}
      />

      {result && (
        <Alert
          sx={{ mt: 2 }}
          severity={result.score === result.total ? "success" : "info"}
        >
          Final Score: {result.score}/{result.total}
        </Alert>
      )}

      <Button sx={{ mt: 2 }} onClick={() => navigate(`/courses/${id}`)}>
        Back to course
      </Button>
    </Box>
  );
}
