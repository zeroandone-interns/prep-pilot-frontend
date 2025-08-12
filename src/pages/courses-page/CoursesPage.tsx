import * as React from 'react'
import { useAppSelector } from '@/store'
import Grid from '@mui/material/Grid' // using Grid v2 (size prop)
import { Card, CardActionArea, CardContent, Typography, Chip, Stack, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

export default function CoursesPage() {
  const courses = useAppSelector((s) => s.courses.items)

  return (
    <Grid container spacing={2}>
      {courses.map((c) => (
        <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={(t) => ({
              position: 'relative',
              borderRadius: 3,
              border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
              boxShadow: `0 6px 18px ${alpha('#000', 0.06)}`,
              transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 12px 26px ${alpha('#000', 0.12)}`,
                borderColor: t.palette.primary.main,
              },
            })}
          >
            {/* subtle top accent */}
            <Box
              sx={(t) => ({
                height: 4,
                background: `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
              })}
            />
            <CardActionArea component={RouterLink} to={`/courses/${c.id}`}>
              <CardContent sx={{ p: 2.25 }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {c.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                  Difficulty: {c.difficulty}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {c.awsServices.slice(0, 4).map((s) => (
                    <Chip key={s} size="small" label={s} />
                  ))}
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
