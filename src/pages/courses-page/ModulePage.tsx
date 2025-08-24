import * as React from "react";
import { useParams, Link as RouterLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
} from "@mui/material";
import MediaBlock from "@/components/MediaBlock";
import Quiz from "@/components/Quiz";
import axios from "axios";

interface Section {
  id: number;
  title: string;
  is_complete: boolean;
  module_id: number;
  blocks?: { kind: string; text?: string; media?: any }[];
  quiz?: any[];
}

export default function SectionPage() {
  const location = useLocation();
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

console.log("Course:", Coursetitle);
console.log("Module:", Moduletitle);

  useEffect(() => {
    if (!moduleId) return;

    const fetchSections = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:3000/courses/section/${moduleId}`
        );
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
      <Breadcrumbs sx={{ mb: 2 }}>
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

      {/* Sections List */}
      {sections.map((section) => (
        <Box key={section.id} sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {section.title}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {section.blocks?.map((b, i) =>
            b.kind === "paragraph" ? (
              <Typography key={i} sx={{ mb: 2 }}>
                {b.text}
              </Typography>
            ) : (
              <MediaBlock key={i} media={b.media} />
            )
          )}

          {section.quiz && section.quiz.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Section Quiz
              </Typography>
              <Quiz
                questions={section.quiz}
                onSubmit={(score, total) => {
                  console.log("Section quiz submitted", { score, total });
                  // TODO: mark section as completed in backend
                }}
              />
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}
