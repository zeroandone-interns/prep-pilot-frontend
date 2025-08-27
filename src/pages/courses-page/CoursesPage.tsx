// src/pages/courses-page/CoursesPage.tsx
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  Skeleton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CoursesPage() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [courses, setCourses] = useState<
    {
      id: number;
      title: string;
      description: string;
      level: string;
      enrolled: boolean;
      progress: number;
    }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollFilter, setEnrollFilter] = useState<
    "all" | "enrolled" | "notEnrolled"
  >("all");
  const [sortBy, setSortBy] = useState<"title" | "progress">("title");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const sub = localStorage.getItem("sub");
        if (!sub) return console.error("No sub found in localStorage");

        const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
        const userId = userRes.data.id;
        if (!userId) throw new Error("Missing userId from backend.");

        const coursesRes = await axios.get(
          `${BaseUrl}/courses/by-user/${userId}`
        );
        const coursesData = coursesRes.data;

        const coursesWithProgress = await Promise.all(
          coursesData.map(async (c: any) => {
            if (!c.enrolled) return { ...c, progress: 0 };
            const progressRes = await axios.get(
              `${BaseUrl}/courses/progress/${userId}/course/${c.id}`
            );
            return { ...c, progress: progressRes.data?.percentage ?? 0 };
          })
        );

        setCourses(coursesWithProgress);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const CardShell = ({
    children,
    enrolled,
  }: {
    children: React.ReactNode;
    enrolled?: boolean;
  }) => (
    <Card
      sx={(t) => ({
        position: "relative",
        borderRadius: 3,
        border: `1px solid ${
          enrolled
            ? alpha(t.palette.success.main, 0.7)
            : alpha(t.palette.primary.main, 0.18)
        }`,
        boxShadow: `0 6px 18px ${alpha("#000", 0.06)}`,
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 12px 26px ${alpha("#000", 0.12)}`,
          borderColor: enrolled
            ? t.palette.success.main
            : t.palette.primary.main,
        },
      })}
    >
      <Box
        sx={(t) => ({
          height: 4,
          background: enrolled
            ? t.palette.success.main
            : `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
        })}
      />
      {children}
    </Card>
  );

  const filteredCourses = courses
    .filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((c) => {
      if (enrollFilter === "enrolled") return c.enrolled;
      if (enrollFilter === "notEnrolled") return !c.enrolled;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return b.progress - a.progress;
      return 0;
    });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        mt: 3,
      }}
    >
      {/* Search and Filters */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          label="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Stack direction="row" spacing={1}>
          <Chip
            label="All"
            color={enrollFilter === "all" ? "primary" : "default"}
            onClick={() => setEnrollFilter("all")}
          />
          <Chip
            label="Enrolled"
            color={enrollFilter === "enrolled" ? "primary" : "default"}
            onClick={() => setEnrollFilter("enrolled")}
          />
          <Chip
            label="Not Enrolled"
            color={enrollFilter === "notEnrolled" ? "primary" : "default"}
            onClick={() => setEnrollFilter("notEnrolled")}
          />
        </Stack>

        <FormControl fullWidth>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value as "title" | "progress")}
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="progress">Progress</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Courses Grid */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "center",
        }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Box
              key={`skeleton-${i}`}
              sx={{ flex: "1 1 300px", maxWidth: 350 }}
            >
              <CardShell>
                <CardActionArea>
                  <CardContent sx={{ p: 2.25 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">
                        <Skeleton width="70%" />
                      </Typography>
                      <Skeleton
                        variant="rounded"
                        width={70}
                        height={24}
                        sx={{ borderRadius: "16px" }}
                      />
                    </Stack>
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
            </Box>
          ))
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((c) => (
            <Box key={c.id} sx={{ flex: "1 1 300px", maxWidth: 350 }}>
              <CardShell enrolled={c.enrolled}>
                {c.enrolled && (
                  <>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        background: "#e0e0e0",
                        overflow: "hidden",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={(t) => ({
                          height: "100%",
                          width: `${c.progress}%`,
                          background: t.palette.success.main,
                          transition: "width 0.3s ease",
                        })}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ pl: 1 }}>
                      {c.progress}% completed
                    </Typography>
                  </>
                )}

                <CardActionArea
                  component={RouterLink}
                  to={`/courses/${c.id}`}
                  state={{
                    enrolled: c.enrolled,
                    title: c.title,
                    description: c.description,
                    level: c.level,
                  }}
                >
                  <CardContent sx={{ p: 2.25 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6">{c.title}</Typography>
                      <Chip
                        label={c.enrolled ? "Enrolled" : "Enroll now"}
                        color={c.enrolled ? "success" : "default"}
                        size="small"
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.25 }}
                    >
                      {c.description}
                    </Typography>
                    <Chip
                      label={c.level}
                      color={
                        c.level.toLowerCase() === "beginner"
                          ? "success"
                          : c.level.toLowerCase() === "intermediate"
                          ? "warning"
                          : "error"
                      }
                      size="small"
                    />
                  </CardContent>
                </CardActionArea>
              </CardShell>
            </Box>
          ))
        ) : (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
            No courses found.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
