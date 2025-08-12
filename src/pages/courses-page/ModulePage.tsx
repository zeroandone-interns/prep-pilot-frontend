import * as React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useAppSelector } from "@/store";
import { Box, Typography, Breadcrumbs, Link, Divider } from "@mui/material";
import MediaBlock from "@/components/MediaBlock";
import Quiz from "@/components/Quiz";

export default function ModulePage() {
  const { id, moduleId } = useParams();
  const course = useAppSelector((s) => s.courses.items.find((c) => c.id === id));
  const module = course?.modules.find((m) => m.id === moduleId);

  if (!course || !module) return <Typography>Module not found.</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">Courses</Link>
        <Link component={RouterLink} to={`/courses/${course.id}`} underline="hover">{course.title}</Link>
        <Typography color="text.primary">{module.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>{module.title}</Typography>
      <Divider sx={{ mb: 2 }} />

      {module.blocks.map((b, i) => {
        if (b.kind === "paragraph") {
          return <Typography key={i} sx={{ mb: 2 }}>{b.text}</Typography>;
        }
        return <MediaBlock key={i} media={b.media} />;
      })}

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Module Quiz</Typography>
      <Quiz questions={module.quiz} onSubmit={(score, total) => {
        console.log("Module quiz submitted", { score, total });
        // TODO: call backend to persist progress
      }} />
    </Box>
  );
}