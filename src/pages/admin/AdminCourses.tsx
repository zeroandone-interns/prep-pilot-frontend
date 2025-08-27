// src/pages/admin/AdminCourses.tsx
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Button,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "@/components/SnackbarProvider";
import axios from "axios";

export default function AdminCourses() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const [courses, setCourses] = useState<
    {
      id: number;
      title: string;
      description: string;
      level: string;
      duration: string;
      nb_of_modules: number;
      nb_of_sections: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const sub = localStorage.getItem("sub");

  const fetchCourses = async () => {
    if (!sub) {
      showMessage("User not found in localStorage", "error");
      return;
    }

    try {
      setLoading(true); // start loading
      const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
      const user = userRes.data;
      const { id: userId, organization_id: organizationId } = user;

      if (!userId || !organizationId) {
        throw new Error("Missing userId or organizationId from backend.");
      }

      const coursesResult = await axios.get(
        `${BaseUrl}/courses/organization/${organizationId}`
      );
      setCourses(coursesResult.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false); // stop loading
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleViewCourse = (id: number) => {
    navigate(`/admin/course/${id}`);
  };

  return (
    <Box className="admin-courses">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Courses</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/admin/courses/new")}
        >
          New Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small" className="courses-table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Number Of Modules</TableCell>
              <TableCell>Number Of Sections</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton
                        variant={j === 6 ? "circular" : "text"}
                        width={j === 6 ? 40 : "80%"}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : courses.length > 0 ? (
              courses.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>{c.level}</TableCell>
                  <TableCell>{c.duration}</TableCell>
                  <TableCell>{c.nb_of_modules}</TableCell>
                  <TableCell>{c.nb_of_sections}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Course">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewCourse(c.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Course">
                      <IconButton color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No courses found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
