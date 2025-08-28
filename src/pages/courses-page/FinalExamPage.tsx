import * as React from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";
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
import type { MCQQuestionWithExplanation } from "@/types/course"; // make sure this type has "explanation?: string"

export default function FinalExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const course = useSelector((state: RootState) => state.course);
  const lang = useSelector((state: RootState) => state.language.lang);

  const [questions, setQuestions] = React.useState<
    MCQQuestionWithExplanation[] | null
  >(null);
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

    axios
      .get(`${BaseUrl}/courses/questions/${id}`)
      .then((res) => {
        const data: MCQQuestionWithExplanation[] = res.data.map((q: any) => ({
          id: q.id.toString(),
          prompt: q[`question_text_${lang}`] ?? "",
          options: [
            { id: "1", text: q[`option1_${lang}`] ?? "" },
            { id: "2", text: q[`option2_${lang}`] ?? "" },
            { id: "3", text: q[`option3_${lang}`] ?? "" },
          ],
          correctOptionId: (() => {
            if (q[`correct_answer_${lang}`] === q[`option1_${lang}`])
              return "1";
            if (q[`correct_answer_${lang}`] === q[`option2_${lang}`])
              return "2";
            if (q[`correct_answer_${lang}`] === q[`option3_${lang}`])
              return "3";
            return "1";
          })(),
          explanation: q[`explanation_${lang}`] ?? "", // always a string
        }));
        setQuestions(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load exam questions.");
      })
      .finally(() => setLoading(false));
  }, [course, lang]);

  if (!course) return <Typography>Course not found.</Typography>;
  if (loading) return <Typography>Loading questions...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!questions || !questions.length)
    return <Typography>No questions for this exam.</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">
          Courses
        </Link>
        <Link component={RouterLink} to={`/courses/${id}`} underline="hover">
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
