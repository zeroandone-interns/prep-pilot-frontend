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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Delete, Edit, Save, Cancel, ArrowBack } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useSnackbar } from "@/components/SnackbarProvider";
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
  const AIUrl = import.meta.env.VITE_AI_BASE_URL;
  const { showMessage } = useSnackbar();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [newDocs, setNewDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

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


  const handleMarkDeleteDoc = (docId: number) => {
    setCourse((prev) =>
      prev
        ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) }
        : prev
    );
    setPendingDeletes((prev) => [...prev, docId]);
  };



  const handleSave = async () => {
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setLoading(true);

      // 1. update course fields
      await axios.put(`${BaseUrl}/courses/${courseId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. delete pending documents
      if (pendingDeletes.length > 0) {
        for (const docId of pendingDeletes) {
          await axios.delete(`${BaseUrl}/courses/documents/${docId}`);
        }
      }

      // 3. upload new docs if any
      if (newDocs.length > 0) {
        const form = new FormData();
        newDocs.forEach((file) => form.append("files", file));
        await axios.post(`${BaseUrl}/courses/upload/${courseId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // else we need to call the AI generate course endpoint (if no new documents are uploaded)
        setLoading(true); // start loader
        try {
          const generateCourse = await axios.post(
            `${BaseUrl}/courses/generate`,
            {
              courseId,
            }
          );

          if (generateCourse.data.success) {
            showMessage("Course content updated successfully", "success");
            console.log("Course content generated successfully");
          } else {
            console.error(
              "Failed to generate course content:",
              generateCourse.data.message
            );
            showMessage("Failed to generate course content", "error");
          }
        } catch (err) {
          console.error("AI generate course failed:", err);
          showMessage("AI course generation failed", "error");
        } finally {
          setLoading(false); // stop loader
        }
      }

      // 4. refresh course
      const res = await axios.get(`${BaseUrl}/courses/details/${courseId}`);
      setCourse(res.data);
      setEditMode(false);
      setNewDocs([]);
      setPendingDeletes([]);
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
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
                      onClick={() => handleMarkDeleteDoc(doc.id)}
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          Are you sure you want to apply these changes?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSave}
            color="primary"
            disabled={loading}
          >
            {loading ? "Applying..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
