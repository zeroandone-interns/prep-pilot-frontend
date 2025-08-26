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
  Button
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

  const [courses, setCourses] = useState([
    {
      id: 0,
      title: "",
      description: "",
      level: "",
      duration: "",
      nb_of_modules: 0,
      nb_of_sections: 0,
    },
  ]);
  const { showMessage } = useSnackbar();

  const sub = localStorage.getItem("sub");

  const fetchCourses = async () => {
    if (!sub) {
      showMessage("User not found in localStorage", "error");
      return;
    }

    try {
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
            {courses.map((c) => (
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
