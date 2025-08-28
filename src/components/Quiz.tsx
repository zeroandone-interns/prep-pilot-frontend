import * as React from 'react'
import { Box, Card, CardContent, Typography, RadioGroup, FormControlLabel, Radio, Button, Stack, Alert } from '@mui/material'
import type { MCQQuestion } from '@/types/course'

interface MCQQuestionWithExplanation extends MCQQuestion {
  explanation?: string;
}

interface Props {
  questions: MCQQuestionWithExplanation[];
  onSubmit?: (score: number, total: number) => void;
}

export default function Quiz({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const total = questions.length;

  const score = React.useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctOptionId ? 1 : 0),
      0
    );
  }, [submitted, answers, questions]);

  function handleChange(qid: string, optId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: optId }));
  }

  function handleSubmit() {
    setSubmitted(true);
    onSubmit?.(
      questions.reduce(
        (acc, q) => acc + (answers[q.id] === q.correctOptionId ? 1 : 0),
        0
      ),
      total
    );
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <Box>
      {questions.map((q, idx) => {
        const chosen = answers[q.id];
        const isCorrect = submitted && chosen === q.correctOptionId;
        const showWrong = submitted && chosen && chosen !== q.correctOptionId;

        return (
          <Box
            key={q.id}
            sx={{ mb: 2, border: "1px solid #ccc", borderRadius: 2, p: 2 }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Q{idx + 1}. {q.prompt}
            </Typography>

            {q.options.map((opt) => {
              const isChosen = chosen === opt.id;
              const isWrongChosen = showWrong && isChosen;

              return (
                <Button
                  key={opt.id}
                  variant={isChosen ? "contained" : "outlined"}
                  color={isWrongChosen ? "error" : "primary"}
                  onClick={() => handleChange(q.id, opt.id)}
                  disabled={submitted}
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {opt.text}
                </Button>
              );
            })}

            {submitted && (
              <>
                <Typography
                  sx={{ mt: 1 }}
                  color={isCorrect ? "success.main" : "error.main"}
                >
                  {isCorrect ? "Correct!" : "Incorrect."}
                </Typography>

                {/* Show explanation */}
                {q.explanation && (
                  <Typography sx={{ mt: 0.5, fontStyle: "italic" }}>
                    Explanation: {q.explanation}
                  </Typography>
                )}
              </>
            )}
          </Box>
        );
      })}

      {/* Actions */}
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        {!submitted ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== total}
          >
            Submit
          </Button>
        ) : (
          <>
            <Alert
              severity={score === total ? "success" : "info"}
              sx={{ flex: 1 }}
            >
              Score: {score}/{total}
            </Alert>
            <Button variant="outlined" onClick={reset}>
              Repeat quiz
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
