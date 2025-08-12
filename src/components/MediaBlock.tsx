import * as React from 'react'
import { Box, Paper, Typography, Button } from '@mui/material'
import type { MediaItem } from '@/types/course'

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      // https://www.youtube.com/watch?v=ID  ->  https://www.youtube.com/embed/ID
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      // https://youtu.be/ID -> https://www.youtube.com/embed/ID
      const id = u.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    return null
  } catch { return null }
}

function toVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch { return null }
}

export default function MediaBlock({ media }: { media: MediaItem }) {
  const { type, url, caption } = media

  // Don’t embed same-origin (prevents “app inside app”)
  let safeToEmbed = true
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin) safeToEmbed = false
  } catch { safeToEmbed = false }

  if (type === 'image') {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Box component="img" src={url} alt={caption || 'Image'} sx={{ width: '100%', borderRadius: 1 }} />
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </Paper>
    )
  }

  // video
  let embedSrc: string | null = null
  if (safeToEmbed) {
    embedSrc = toYouTubeEmbed(url) || toVimeoEmbed(url)
  }

  if (embedSrc) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 1, overflow: 'hidden' }}>
          <Box
            component="iframe"
            src={embedSrc}
            title={caption || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </Box>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </Paper>
    )
  }

  // Fallback: don’t embed unknown/unsafe URLs — show a button instead
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>{caption || 'External video'}</Typography>
      <Button
        variant="outlined"
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open video
      </Button>
    </Paper>
  )
}
