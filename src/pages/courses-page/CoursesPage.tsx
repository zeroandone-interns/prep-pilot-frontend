import * as React from 'react'
import { useAppSelector } from '@/store'
import Grid from '@mui/material/Grid'
import { Card, CardActionArea, CardContent, Typography, Chip, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function CoursesPage() {
  const courses = useAppSelector((s) => s.courses.items)
  return (
    <Grid container spacing={2}>
      {courses.map((c) => (
        <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardActionArea component={RouterLink} to={`/courses/${c.id}`}>
              <CardContent>
                <Typography variant="h6">{c.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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