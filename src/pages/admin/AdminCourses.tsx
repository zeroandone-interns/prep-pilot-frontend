import * as React from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Stack, Typography, Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/store'
import { addCourse, deleteCourse, injectGeneratedFinalExam, injectGeneratedModule } from '@/store/coursesSlice'

export default function AdminCourses() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const courses = useAppSelector((s) => s.courses.items)

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ title: '', difficulty: 'Beginner', services: '' })

  const handleSave = () => {
    const services = form.services.split(',').map((s) => s.trim()).filter(Boolean)
    dispatch(addCourse({ title: form.title.trim(), difficulty: form.difficulty.trim(), awsServices: services }))
    setForm({ title: '', difficulty: 'Beginner', services: '' })
    setOpen(false)
  }

  const simulateGenerate = (courseId: string, courseTitle: string) => {
    // Inject a module that conforms to the new shape: { id, title, sections: [...] }
    dispatch(injectGeneratedModule({
      courseId,
      module: {
        id: `m-${Date.now()}`,
        title: `${courseTitle} — Module 1`,
        sections: [
          {
            id: `s-${Date.now()}`,
            title: 'Section 1: Overview',
            blocks: [
              { kind: 'paragraph' as const, text: 'This section was generated from uploaded documents, links, and videos.' },
              { kind: 'paragraph' as const, text: 'It introduces the topic and outlines key learning outcomes.' },
              {
                kind: 'media' as const,
                media: { type: 'image' as const, url: 'https://via.placeholder.com/800x420?text=Generated+Section', caption: 'Auto-generated visual' },
              },
            ],
            quiz: [
              {
                id: 'gq1',
                prompt: 'What is the source of this section?',
                options: [
                  { id: 'a', text: 'Uploaded resources (docs/links/videos)' },
                  { id: 'b', text: 'Random generator' },
                  { id: 'c', text: 'User chat only' },
                ],
                correctOptionId: 'a',
              },
              {
                id: 'gq2',
                prompt: 'How many questions are in each section quiz by design?',
                options: [ { id: 'a', text: '1' }, { id: 'b', text: '3' }, { id: 'c', text: '10' } ],
                correctOptionId: 'b',
              },
              {
                id: 'gq3',
                prompt: 'Sections can include which content types?',
                options: [ { id: 'a', text: 'Paragraphs and media' }, { id: 'b', text: 'Only code' }, { id: 'c', text: 'Neither' } ],
                correctOptionId: 'a',
              },
            ],
          }
        ],
      },
    }))

    dispatch(injectGeneratedFinalExam({
      courseId,
      questions: [
        {
          id: 'fe1',
          prompt: 'Final exam question example (MCQ).',
          options: [ { id: 'a', text: 'Correct' }, { id: 'b', text: 'Wrong' }, { id: 'c', text: 'Wrong' } ],
          correctOptionId: 'a',
        },
        {
          id: 'fe2',
          prompt: 'Progress should be saved to…',
          options: [ { id: 'a', text: 'Backend' }, { id: 'b', text: 'Local storage only' }, { id: 'c', text: 'Nowhere' } ],
          correctOptionId: 'a',
        },
        {
          id: 'fe3',
          prompt: 'Final exams are composed of…',
          options: [ { id: 'a', text: 'MCQs' }, { id: 'b', text: 'Essays only' }, { id: 'c', text: 'True/False only' } ],
          correctOptionId: 'a',
        },
      ],
    }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Courses</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => navigate('/admin/courses/new')}>
          Create Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Modules</TableCell>
              <TableCell>Final Exam</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.title}</TableCell>
                <TableCell><Chip size="small" label={c.difficulty || 'N/A'} /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(c.awsServices?.slice(0, 5) || []).map((s) => <Chip key={s} size="small" label={s} />)}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip size="small" color={c.modules?.length ? 'secondary' : 'default'} label={`${c.modules?.length ?? 0}`} />
                </TableCell>
                <TableCell>
                  <Chip size="small" color={c.finalExam ? 'secondary' : 'default'} label={c.finalExam ? 'Yes' : 'No'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Simulate Generate Course (Module + Final)">
                    <IconButton color="primary" onClick={() => simulateGenerate(c.id, c.title)}>
                      <AutoAwesomeIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Course">
                    <IconButton color="error" onClick={() => dispatch(deleteCourse(c.id))}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Optional legacy dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create Course</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: 420 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          <TextField label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} placeholder="Beginner / Intermediate / Advanced" />
          <TextField label="AWS Services (comma-separated)" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Lambda, API Gateway, DynamoDB" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.title.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
