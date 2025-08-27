// src/pages/courses-page/CourseDetailPage.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Stack,
} from "@mui/material";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const {
    enrolled: initialEnrolled,
    title,
    description,
    level,
  } = location.state || {
    enrolled: false,
    title: "",
    description: "",
    level: "",
  };

  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [modules, setModules] = useState<{ id: number; title: string }[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [userId, setUserId] = useState(null);

  // Fetch modules only
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const ModulesRes = await axios.get(`${BaseUrl}/courses/module/${id}`);
        setModules(ModulesRes.data);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
      }
    };

    fetchModules();
    fetchUser();
  }, [id]);

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
  };

  if (!modules) return <Typography>Course not found.</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Section: Course Info + Enroll Button */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {description}
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            Level: {level || "N/A"}
          </Typography>
        </Box>

        <Box>
          <Button
            variant="contained"
            color={enrolled ? "success" : "primary"}
            onClick={() => setOpenDialog(true)}
            disabled={enrolled}
          >
            {enrolled ? "Enrolled" : "Enroll Now"}
          </Button>
        </Box>
      </Stack>

      {/* Enrollment Confirmation Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to enroll in this course?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setEnrolled(true);
              setOpenDialog(false);
              await axios.post(
                `${BaseUrl}/courses/enroll/${id}`,
                {}, 
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
            }}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modules List */}
      {modules.map((m, index) => (
        <Card
          key={m.id}
          sx={{
            mb: 2,
            opacity: enrolled ? 1 : 0.5,
            pointerEvents: enrolled ? "auto" : "none",
            transition: "opacity 0.3s",
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          {enrolled ? (
            <CardActionArea
              component={RouterLink}
              to={`/courses/${id}/modules/${m.id}`}
              state={{
                Coursetitle: title,
                Moduletitle: m.title,
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography color="text.primary">
                  {index + 1}. {m.title}
                </Typography>
              </Box>
            </CardActionArea>
          ) : (
            <Tooltip title="Enroll now to access this module">
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                  {index + 1}. {m.title}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Card>
      ))}

      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}
