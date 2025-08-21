import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import { Delete, Edit, Save, Cancel, ArrowBack } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";

interface Document {
  id: number;
  url: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  duration: string;
  nb_of_modules: number;
  nb_of_sections: number;
  organizationId: number;
  documents: Document[];
}

export default function AdminViewCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [newDocs, setNewDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`${BaseUrl}/courses/details/${courseId}`);
        setCourse(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  const handleFieldChange = (field: keyof Course, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await axios.delete(`${BaseUrl}/courses/documents/${docId}`);
      setCourse((prev) =>
        prev
          ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) }
          : prev
      );
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // update course fields
      await axios.put(`${BaseUrl}/courses/${courseId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // upload new docs if any
      if (newDocs.length > 0) {
        const form = new FormData();
        newDocs.forEach((file) => form.append("files", file));
        await axios.post(`${BaseUrl}/courses/upload/${courseId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // refresh course
      const res = await axios.get(`${BaseUrl}/courses/details/${courseId}`);
      setCourse(res.data);
      setEditMode(false);
      setNewDocs([]);
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewDocs((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeNewDoc = (index: number) => {
    setNewDocs((prev) => prev.filter((_, i) => i !== index));
  };

  if (!course) return <Typography>Loading...</Typography>;

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">{course.title}</Typography>
          {!editMode ? (
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>

              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/admin/courses")}
              >
                Back
              </Button>
            </Box>
          ) : (
            <Box>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                {loading ? "Saving Changes..." : "Save"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => {
                  setEditMode(false);
                  setFormData(course); // reset form
                  setNewDocs([]);
                }}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {editMode ? (
          <Box display="grid" gap={2}>
            <TextField
              label="Title"
              value={formData.title || ""}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              fullWidth
            />
            <TextField
              label="Level"
              value={formData.level || ""}
              onChange={(e) => handleFieldChange("level", e.target.value)}
            />
            <TextField
              label="Duration"
              value={formData.duration || ""}
              onChange={(e) => handleFieldChange("duration", e.target.value)}
            />
            <TextField
              label="Modules"
              type="number"
              value={formData.nb_of_modules || ""}
              onChange={(e) =>
                handleFieldChange("nb_of_modules", Number(e.target.value))
              }
            />
            <TextField
              label="Sections"
              type="number"
              value={formData.nb_of_sections || ""}
              onChange={(e) =>
                handleFieldChange("nb_of_sections", Number(e.target.value))
              }
            />
          </Box>
        ) : (
          <Box>
            <Typography>{course.description}</Typography>
            <Typography>Level: {course.level}</Typography>
            <Typography>Duration: {course.duration}</Typography>
            <Typography>Modules: {course.nb_of_modules}</Typography>
            <Typography>Sections: {course.nb_of_sections}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Documents
        </Typography>
        {course.documents && course.documents.length > 0 ? (
          <List>
            {course.documents.map((doc) => (
              <ListItem
                key={doc.id}
                secondaryAction={
                  editMode && (
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleDeleteDoc(doc.id)}
                    >
                      <Delete />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {decodeURIComponent(
                        doc.url.split("/").pop()?.split("?")[0] || "Document"
                      )}
                    </Link>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No documents uploaded.</Typography>
        )}

        {editMode && (
          <Box mt={2}>
            <Box
              {...getRootProps()}
              sx={{
                border: "2px dashed gray",
                p: 2,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <Typography>Drop the files here...</Typography>
              ) : (
                <Typography>
                  Drag & drop files here, or click to select
                </Typography>
              )}
            </Box>

            {newDocs.length > 0 && (
              <Box mt={1}>
                <Typography variant="subtitle2">Selected files:</Typography>
                <List dense>
                  {newDocs.map((file, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => removeNewDoc(index)}
                        >
                          <Cancel />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
