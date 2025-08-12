import * as React from "react";
import { Box, Card, CardContent, RadioGroup, FormControlLabel, Radio, Button, Typography, Stack, Alert } from "@mui/material";
import type { MCQQuestion } from "@/types/course";

interface Props {
  questions: MCQQuestion[];
  onSubmit?: (score: number, total: number) => void;
}

export default function Quiz({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const handleChange = (qid: string, optId: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: optId }));
  };

  const handleSubmit = () => {
    let s = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctOptionId) s += 1;
    }
    setScore(s);
    setSubmitted(true);
    onSubmit?.(s, questions.length);
  };

  return (
    <Box>
      <Stack spacing={2}>
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent>
              <Typography variant="subtitle1">Q{idx + 1}. {q.prompt}</Typography>
              <RadioGroup
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
              >
                {q.options.map((o) => (
                  <FormControlLabel key={o.id} value={o.id} control={<Radio/>} label={o.text} />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={handleSubmit}>Submit</Button>
        {submitted && (
          <Alert severity={score === questions.length ? "success" : "info"}>
            Score: {score}/{questions.length}
          </Alert>
        )}
      </Box>
    </Box>
  );
}