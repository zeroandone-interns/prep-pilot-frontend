import * as React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useAppSelector } from "@/store";
import { Box, Breadcrumbs, Link, Typography, List, ListItem, ListItemButton, ListItemText, Divider, Button } from "@mui/material";

export default function CourseDetailPage() {
  const { id } = useParams();
  const course = useAppSelector((s) => s.courses.items.find((c) => c.id === id));

  if (!course) return <Typography>Course not found.</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">Courses</Link>
        <Typography color="text.primary">{course.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 1 }}>{course.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Difficulty: {course.difficulty} • Services: {course.awsServices.join(", ")}
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>Modules</Typography>
      <List>
        {course.modules.map((m, idx) => (
          <ListItem key={m.id} disablePadding>
            <ListItemButton component={RouterLink} to={`/courses/${course.id}/modules/${m.id}`}>
              <ListItemText primary={`Module ${idx + 1}: ${m.title}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {course.finalExam && (
        <Button variant="contained" component={RouterLink} to={`/courses/${course.id}/exam`}>
          Take Final Exam
        </Button>
      )}
    </Box>
  );
}