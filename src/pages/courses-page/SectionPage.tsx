import { useParams, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
  Button
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";


interface Paragraph {
  id: number;
  content_title: string;
  content_body: string;
  section_id: number;
}

export default function SectionPage() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const { id, moduleId, sectionId } = useParams();
  const navigate = useNavigate();

  const { Coursetitle, Moduletitle, Sectiontitle } = (location.state as {
    Coursetitle: string;
    Moduletitle: string;
    Sectiontitle: string;
  }) || { Coursetitle: "", Moduletitle: "", Sectiontitle: "" };

  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const[userId , setUserId]= useState(null);

  useEffect(() => {
    if (!sectionId) return;

    const fetchParagraphs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${BaseUrl}/courses/paragraph/${sectionId}`
        );
        setParagraphs(res.data);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch paragraphs");
        setLoading(false);
      } 
    };

    const fetchUser = async () => {
      try {
        const sub = localStorage.getItem("sub");
        if (!sub) return console.error("No sub found in localStorage");

        const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
        const user = userRes.data;
        const userId = user.id;
        setUserId(userId);

        if (!userId) throw new Error("Missing userId from backend.");
        
      } catch (error) {
        console.log(error);
        
      }
    }

    fetchParagraphs();
    fetchUser();
  }, [sectionId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/courses" underline="hover">
          Courses
        </Link>
        <Link component={RouterLink} to={`/courses/${id}`} underline="hover">
          {Coursetitle}
        </Link>
        <Link
          component={RouterLink}
          to={`/courses/${id}/modules/${moduleId}`}
          underline="hover"
        >
          {Moduletitle}
        </Link>
        <Typography color="text.primary">{Sectiontitle}</Typography>
      </Breadcrumbs>

      {/* Section Title */}
      <Typography variant="h4" sx={{ mb: 2 }}>
        {Sectiontitle}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Paragraphs */}
      {paragraphs.map((p) => (
        <Box key={p.id} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {p.content_title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {p.content_body}
          </Typography>
          <Divider />
        </Box>
      ))}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: "#1976d2", // primary blue
            "&:hover": {
              backgroundColor: "#115293",
            },
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: "bold",
          }}
          onClick={async () => {
            try {
              const res = await axios.get(
                `${BaseUrl}/courses/${id}/${moduleId}/${sectionId}`
              );
              const next = res.data;

              if (next) {
                // Update progress in DB
                await axios.post(`${BaseUrl}/courses/progress`, {
                  userId,
                  courseId: Number(id),
                  moduleId: next.moduleId,
                  sectionId: next.sectionId,
                });

                navigate(
                  `/courses/${id}/modules/${next.moduleId}/sections/${next.sectionId}`,
                  {
                    state: {
                      Coursetitle,
                      Moduletitle: next.moduleTitle ?? Moduletitle,
                      Sectiontitle: next.sectionTitle,
                    },
                  }
                );
              } else {
                await axios.post(`${BaseUrl}/courses/progress`, {
                  userId,
                  courseId: Number(id),
                  moduleId: next.moduleId,
                  sectionId: next.sectionId,
                  completed: true
                });
                alert("🎉 You've completed the course!");
              }
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
