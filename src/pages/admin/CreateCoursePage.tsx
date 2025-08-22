// src/pages/admin/CreateCoursePage.tsx
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Stack,
  Button,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { Link as LinkIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Dropzone from "react-dropzone";

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [nbOfModules, setNbOfModules] = React.useState<number | "">("");
  const [nbOfSections, setNbOfSections] = React.useState<number | "">("");
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);

  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const sub = localStorage.getItem("sub");

  const onDrop = (acceptedFiles: File[]) => {
    setDocuments((prev) => [...prev, ...acceptedFiles]);
  };

  const removeDocument = (idx: number) =>
    setDocuments((prev) => prev.filter((_, i) => i !== idx));

  const handleGenerate = async () => {
    if (!sub) {
      alert("User not found in localStorage.");
      return;
    }

    setLoading(true);

    try {
      const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
      const user = userRes.data;
      const userId = user.id;
      const organizationId = user.organization_id;

      if (!userId || !organizationId) {
        throw new Error("Missing userId or organizationId from backend.");
      }

      const CreatedCourse = await axios.post(
        `${BaseUrl}/courses`,
        {
          title,
          description,
          level,
          duration,
          nb_of_modules: nbOfModules,
          nb_of_sections: nbOfSections,
          createdById: userId,
          organizationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Course created successfully!");
      const courseId = CreatedCourse.data.id;

      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((file) => {
          formData.append("files", file);
        });

        try {
          const response = await axios.post(
            `${BaseUrl}/courses/upload/${courseId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          console.log("Upload response:", response.data);
          alert("Files uploaded successfully");
        } catch (err) {
          console.error(err);
          alert("Failed to upload files");
        }
      }

      navigate("/admin/courses");
    } catch (err) {
      console.error(err);
      alert("Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Card>
        <CardHeader
          title="New Course"
          subheader="Provide content for generation"
        />
        <CardContent>
          <Stack spacing={2.5}>
            <TextField
              label="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <TextField
              label="Description / Prompt"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              helperText="Describe the topic and scope."
            />
            <TextField
              label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
            <TextField
              label="Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <TextField
              label="Number of Modules"
              type="number"
              value={nbOfModules}
              onChange={(e) =>
                setNbOfModules(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <TextField
              label="Number of Sections"
              type="number"
              value={nbOfSections}
              onChange={(e) =>
                setNbOfSections(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <Divider textAlign="left">
              <LinkIcon fontSize="small" /> Documents
            </Divider>

            {/* Dropzone Integration */}
            <Dropzone onDrop={onDrop}>
              {({ getRootProps, getInputProps }) => (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    border: "2px dashed #ccc",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <p>Drag & drop some files here, or click to select files</p>
                </Paper>
              )}
            </Dropzone>

            {/* Preview selected files */}
            {documents.length > 0 && (
              <Paper
                variant="outlined"
                sx={{ p: 1, display: "flex", gap: 1, flexWrap: "wrap" }}
              >
                {documents.map((f, i) => (
                  <Chip
                    key={i}
                    label={f.name}
                    onDelete={() => removeDocument(i)}
                  />
                ))}
              </Paper>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/courses")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!title.trim() || loading}
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
