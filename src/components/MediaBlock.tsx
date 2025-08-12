import * as React from "react";
import { Box, Typography } from "@mui/material";
import type { MediaItem } from "@/types/course";

export default function MediaBlock({ media }: { media: MediaItem }) {
  if (media.type === "image") {
    return (
      <Box sx={{ my: 2 }}>
        <img src={media.url} alt={media.caption || "image"} style={{ maxWidth: "100%", borderRadius: 8 }} />
        {media.caption && <Typography variant="caption" display="block">{media.caption}</Typography>}
      </Box>
    );
  }
  // video
  return (
    <Box sx={{ my: 2 }}>
      <iframe
        width="100%"
        height={360}
        src={media.url}
        title={media.caption || "video"}
        style={{ border: 0, borderRadius: 8 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      {media.caption && <Typography variant="caption" display="block">{media.caption}</Typography>}
    </Box>
  );
}