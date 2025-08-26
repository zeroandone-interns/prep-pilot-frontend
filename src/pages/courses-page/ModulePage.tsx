import * as React from "react";
import {
  useParams,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
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

interface Section {
  id: number;
  title: string;
  is_complete: boolean;
  module_id: number;
}

export default function SectionPage() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const { id: courseId, moduleId } = useParams<{
    id: string;
    moduleId: string;
  }>();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { Coursetitle, Moduletitle } = (location.state as {
    Coursetitle: string;
    Moduletitle: string;
  }) || { Coursetitle: "", Moduletitle: "" };

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
            }}
          >
            <CardActionArea
              onClick={() =>
                navigate(
                  `/courses/${courseId}/modules/${moduleId}/sections/${section.id}`,
                  {
                    state: {
                      Coursetitle,
                      Moduletitle,
                      Sectiontitle: section.title,
                    },
                  }
                )
              }
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {section.title}
                </Typography>
                <Typography
                  variant="body2"
                  color={
                    section.is_complete ? "success.main" : "text.secondary"
                  }
                >
                  {section.is_complete ? "Completed ✅" : "Not completed"}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
