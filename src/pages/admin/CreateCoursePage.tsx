// src/pages/admin/CreateCoursePage.tsx
import * as React from 'react'
import {
  Box, Card, CardContent, CardHeader, TextField, Typography, Stack, Button,
  IconButton, Divider, Chip, Paper
} from '@mui/material'
import { Add, Delete as DeleteIcon, Link as LinkIcon, VideoLibrary } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { addCourse, injectGeneratedFinalExam, injectGeneratedModule } from '@/store/coursesSlice'
import type { ContentBlock } from '@/types/course'

export default function CreateCoursePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const courses = useAppSelector(s => s.courses.items)

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [links, setLinks] = React.useState<string[]>([''])
  const [videos, setVideos] = React.useState<string[]>([''])
  const [pdfs, setPdfs] = React.useState<File[]>([])
  const [pendingTitle, setPendingTitle] = React.useState<string | null>(null)

  const onSelectPdfs = (files: FileList | null) => {
    if (!files) return
    const list = Array.from(files).filter(f => f.type === 'application/pdf')
    setPdfs(prev => [...prev, ...list])
  }
  const removePdf = (idx: number) => setPdfs(prev => prev.filter((_, i) => i !== idx))

  const changeIn = (arr: string[], set: (v: string[]) => void, i: number, val: string) => {
    const next = [...arr]; next[i] = val; set(next)
  }
  const addRow = (arr: string[], set: (v: string[]) => void) => set([...arr, ''])
  const removeRow = (arr: string[], set: (v: string[]) => void, i: number) =>
    set(arr.filter((_, idx) => idx !== i))

  const handleGenerate = () => {
    if (!title.trim()) return
    const services = (description.match(/\b(EC2|S3|Lambda|VPC|RDS|DynamoDB|API Gateway|ECS|EKS)\b/gi) || [])
      .map(s => s.toUpperCase())
    dispatch(addCourse({ title: title.trim(), difficulty: 'Beginner', awsServices: Array.from(new Set(services)) }))
    setPendingTitle(title.trim())
  }

  React.useEffect(() => {
    if (!pendingTitle) return
    const created = [...courses].reverse().find(c => c.title === pendingTitle)
    if (!created) return

    // Build blocks with correct literal types
    const blocks: ContentBlock[] = [
      { kind: 'paragraph', text: description || 'This section was generated from your uploaded resources.' },
      ...links.filter(Boolean).slice(0, 2).map((href, i): ContentBlock => ({
        kind: 'paragraph',
        text: `Reference link ${i + 1}: ${href}`,
      })),
      ...videos.filter(Boolean).slice(0, 1).map((v): ContentBlock => ({
        kind: 'media',
        media: { type: 'video' as const, url: v, caption: 'Provided video' },
      })),
      ...(pdfs.length ? [{
        kind: 'paragraph' as const,
        text: `Included PDFs: ${pdfs.map(f => f.name).join(', ')}`,
      }] : []),
    ]

    // Create one module with one section (sections hold blocks + quiz)
    const section = {
      id: `s-${Date.now()}`,
      title: 'Section 1',
      blocks,
      quiz: [
        { id: 'sq1', prompt: 'Was this section generated from your resources?', options: [
          { id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }, { id: 'c', text: 'Maybe' }], correctOptionId: 'a' },
        { id: 'sq2', prompt: 'How many question items per section?', options: [
          { id: 'a', text: '3' }, { id: 'b', text: '1' }, { id: 'c', text: '10' }], correctOptionId: 'a' },
        { id: 'sq3', prompt: 'Sections may include paragraphs and media.', options: [
          { id: 'a', text: 'True' }, { id: 'b', text: 'False' }, { id: 'c', text: 'Only media' }], correctOptionId: 'a' },
      ],
    }

    dispatch(injectGeneratedModule({
      courseId: created.id,
      module: {
        id: `m-${Date.now()}`,
        title: `${created.title} — Module 1`,
        sections: [section],
      }
    }))

    dispatch(injectGeneratedFinalExam({
      courseId: created.id,
      questions: [
        { id: 'fe1', prompt: 'Final exam includes MCQs.', options: [
          { id: 'a', text: 'True' }, { id: 'b', text: 'False' }, { id: 'c', text: 'Sometimes' }], correctOptionId: 'a' },
        { id: 'fe2', prompt: 'Where should progress be saved?', options: [
          { id: 'a', text: 'Backend' }, { id: 'b', text: 'Nowhere' }, { id: 'c', text: 'Clipboard' }], correctOptionId: 'a' },
        { id: 'fe3', prompt: 'This exam was generated from uploaded resources.', options: [
          { id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }, { id: 'c', text: 'Unknown' }], correctOptionId: 'a' },
      ],
    }))

    setPendingTitle(null)
    navigate('/courses')
  }, [pendingTitle, courses, description, links, videos, pdfs, dispatch, navigate])

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Card>
        <CardHeader title="New Course" subheader="Provide content for generation (frontend-only mock)" />
        <CardContent>
          <Stack spacing={2.5}>
            <TextField label="Course Title" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />
            <TextField
              label="Description / Prompt"
              value={description}
              onChange={e=>setDescription(e.target.value)}
              multiline minRows={3}
              helperText="Describe the topic and scope. Mention AWS services if relevant (e.g., Lambda, API Gateway)."
            />

            <Divider textAlign="left"><LinkIcon fontSize="small" /> Links</Divider>
            <Stack spacing={1}>
              {links.map((v,i)=>(
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField fullWidth placeholder="https://docs.aws.amazon.com/..." value={v}
                    onChange={e=>changeIn(links,setLinks,i,e.target.value)} />
                  <IconButton onClick={()=>removeRow(links,setLinks,i)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                    <DeleteIcon/>
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<Add/>} onClick={()=>addRow(links,setLinks)}>Add link</Button>
            </Stack>

            <Divider textAlign="left"><VideoLibrary fontSize="small" /> Videos</Divider>
            <Stack spacing={1}>
              {videos.map((v,i)=>(
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField fullWidth placeholder="https://www.youtube.com/watch?v=..." value={v}
                    onChange={e=>changeIn(videos,setVideos,i,e.target.value)} />
                  <IconButton onClick={()=>removeRow(videos,setVideos,i)} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                    <DeleteIcon/>
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<Add/>} onClick={()=>addRow(videos,setVideos)}>Add video</Button>
            </Stack>

            <Divider textAlign="left">PDFs</Divider>
            <Stack spacing={1}>
              <Button variant="outlined" component="label">
                Select PDF(s)
                <input hidden multiple type="file" accept="application/pdf" onChange={e=>onSelectPdfs(e.target.files)} />
              </Button>
              {!!pdfs.length && (
                <Paper variant="outlined" sx={{ p:1, display:'flex', gap:1, flexWrap:'wrap' }}>
                  {pdfs.map((f,i)=>(<Chip key={i} label={f.name} onDelete={()=>removePdf(i)} />))}
                </Paper>
              )}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={()=>navigate('/admin/courses')}>Cancel</Button>
              <Button variant="contained" onClick={handleGenerate} disabled={!title.trim()}>Generate</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt:1, display:'block' }}>
        Note: This simulates an AWS Bedrock flow on the frontend. Wire it to your backend later.
      </Typography>
    </Box>
  )
}
