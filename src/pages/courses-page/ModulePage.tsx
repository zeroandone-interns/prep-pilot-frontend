// src/pages/courses-page/ModulePage.tsx
import * as React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
  Card,
  CardActionArea,
  CardContent,
  Stack,
} from "@mui/material";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setSection } from "../../store/SectionSlice";
import { type RootState } from "@/store";

interface Section {
  id: number;
  title_en: string;
  title_fr: string;
  title_ar: string;
}

export default function SectionPage() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const module = useSelector((state: RootState) => state.module);
  const course = useSelector((state: RootState) => state.course);
  const language = useSelector((state: RootState) => state.language);
  const lang = language.lang;

  const dispatch = useDispatch();
  const { id: courseId, moduleId } = useParams<{
    id: string;
    moduleId: string;
  }>();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const Coursetitle = course.title;
  const Moduletitle = (module[`title_${lang}` as keyof typeof module] ?? "") as string;

  useEffect(() => {
    if (!moduleId) return;

    const fetchSections = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BaseUrl}/courses/section/${moduleId}`);
        setSections(res.data);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch sections");
        setLoading(false);
      }
    };

    fetchSections();
  }, [moduleId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!sections.length) return <Typography>No sections found.</Typography>;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/courses" underline="hover">
          Courses
        </Link>
        <Link
          component={RouterLink}
          to={`/courses/${courseId}`}
          underline="hover"
        >
          {Coursetitle}
        </Link>
        <Link
          component={RouterLink}
          to={`/courses/${courseId}/modules/${moduleId}`}
          underline="hover"
        >
          {Moduletitle}
        </Link>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Sections in {Moduletitle}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Sections List (Stack instead of Grid) */}
      <Stack spacing={3}>
        {sections.map((section) => (
          <Card
            key={section.id}
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              transition: "0.3s",
              "&:hover": { boxShadow: 6 },
              direction: lang === "ar" ? "rtl" : "ltr",
              textAlign: lang === "ar" ? "right" : "left",
            }}
          >
            <CardActionArea
              component={RouterLink}
              to={`/courses/${courseId}/modules/${moduleId}/sections/${section.id}`}
              onClick={() =>
                dispatch(
                  setSection({
                    title_en: section.title_en,
                    title_ar: section.title_ar,
                    title_fr: section.title_fr,
                  })
                )
              }
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {section[`title_${lang}` as keyof typeof section]}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
