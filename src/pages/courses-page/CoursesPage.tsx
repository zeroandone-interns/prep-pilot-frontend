import Grid from "@mui/material/Grid";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  Skeleton,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CoursesPage() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [courses, SetCourses] = useState<
    { id: number; title: string; description: string; level: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const sub = localStorage.getItem("sub");
        if (!sub) {
          console.error("No sub found in localStorage");
          setLoading(false);
          return;
        }

        const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
        const user = userRes.data;
        const userId = user.id;
        const organizationId = user.organization_id;

        if (!userId || !organizationId) {
          throw new Error("Missing userId or organizationId from backend.");
        }

        const coursesRes = await axios.get(`${BaseUrl}/courses/by-user/${userId}`);
        SetCourses(coursesRes.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const CardShell = ({ children }: { children: React.ReactNode }) => (
    <Card
      sx={(t) => ({
        position: "relative",
        borderRadius: 3,
        border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
        boxShadow: `0 6px 18px ${alpha("#000", 0.06)}`,
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 12px 26px ${alpha("#000", 0.12)}`,
          borderColor: t.palette.primary.main,
        },
      })}
    >
      <Box
        sx={(t) => ({
          height: 4,
          background: `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
        })}
      />
      {children}
    </Card>
  );

  return (
    <Grid container spacing={2}>
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Grid key={`skeleton-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
              <CardShell>
                <CardActionArea>
                  <CardContent sx={{ p: 2.25 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      <Skeleton width="70%" />
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.25 }}>
                      <Skeleton width="100%" />
                      <Skeleton width="92%" />
                      <Skeleton width="80%" />
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.2 }}>
                      <Skeleton width={90} height={24} variant="rounded" />
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </CardShell>
            </Grid>
          ))
        : courses.map((c) => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <CardShell>
                <CardActionArea component={RouterLink} to={`/courses/${c.id}`}>
                  <CardContent sx={{ p: 2.25 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {c.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.25 }}
                    >
                      {c.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.2 }}
                    >
                      {c.level}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </CardShell>
            </Grid>
          ))}
    </Grid>
  );
}
