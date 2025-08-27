// src/components/Quiz.tsx
import * as React from 'react'
import { Box, Card, CardContent, Typography, RadioGroup, FormControlLabel, Radio, Button, Stack, Alert } from '@mui/material'
import type { MCQQuestion } from '@/types/course'

interface Props {
  questions: MCQQuestion[]
  onSubmit?: (score: number, total: number) => void
}

export default function Quiz({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [submitted, setSubmitted] = React.useState(false)
  const total = questions.length

  const score = React.useMemo(() => {
    if (!submitted) return 0
    return questions.reduce((acc, q) => acc + (answers[q.id] === q.correctOptionId ? 1 : 0), 0)
  }, [submitted, answers, questions])

  function handleChange(qid: string, optId: string) {
    if (submitted) return
    setAnswers((p) => ({ ...p, [qid]: optId }))
  }

  function handleSubmit() {
    setSubmitted(true)
    onSubmit?.(questions.reduce((acc, q) => acc + (answers[q.id] === q.correctOptionId ? 1 : 0), 0), total)
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <Box>
      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const chosen = answers[q.id]
          const isCorrect = submitted && chosen === q.correctOptionId
          const showWrong = submitted && chosen && chosen !== q.correctOptionId

          return (
            <Card key={q.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Q{idx + 1}. {q.prompt}
                </Typography>

                <RadioGroup
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                >
                  {q.options.map((opt) => {
                    const isChosen = chosen === opt.id
                    const isWrongChosen = showWrong && isChosen

                    return (
                      <FormControlLabel
                        key={opt.id}
                        value={opt.id}
                        control={<Radio disabled={submitted} />}
                        label={
                          <Box
                            sx={(t) => ({
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              ...(isWrongChosen && {
                                backgroundColor: t.palette.error.light,
                                color: t.palette.error.contrastText,
                              }),
                            })}
                          >
                            {opt.text}
                          </Box>
                        }
                        sx={{
                          alignItems: 'flex-start',
                          my: 0.25,
                        }}
                      />
                    )
                  })}
                </RadioGroup>

                {submitted && (
                  <Alert
                    severity={isCorrect ? 'success' : 'error'}
                    variant="standard"
                    sx={{ mt: 1 }}
                  >
                    {isCorrect ? 'Correct!' : 'Incorrect.'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        {!submitted ? (
          <Button variant="contained" onClick={handleSubmit} disabled={Object.keys(answers).length !== total}>
            Submit
          </Button>
        ) : (
          <>
            <Alert severity={score === total ? 'success' : 'info'} sx={{ flex: 1 }}>
              Score: {score}/{total}
            </Alert>
            <Button variant="outlined" onClick={reset}>
              Repeat quiz
            </Button>
          </>
        )}
      </Stack>
    </Box>
  )
}
