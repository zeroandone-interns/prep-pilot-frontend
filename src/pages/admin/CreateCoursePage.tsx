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
  MenuItem
} from "@mui/material";
import { Link as LinkIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "@/components/SnackbarProvider";
import axios from "axios";
import Dropzone from "react-dropzone";

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [durationValue, setDurationValue] = React.useState<number | "">("");
  const [durationUnit, setDurationUnit] = React.useState("hours");
  const [nbOfModules, setNbOfModules] = React.useState<number | "">("");
  const [nbOfSections, setNbOfSections] = React.useState<number | "">("");
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { showMessage } = useSnackbar();

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
      showMessage("User not found in localStorage", "error");
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
          duration: `${durationValue} ${durationUnit}`,
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

      showMessage("Course created successfully!", "success");
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
          showMessage("Files uploaded successfully!", "success");
        } catch (err) {
          console.error(err);
          showMessage("Failed to upload files", "error");
        }
      }

      navigate("/admin/courses");
    } catch (err) {
      console.error(err);
      showMessage("Failed to create course.", "error");
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
              select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <MenuItem value="">N/A</MenuItem>
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </TextField>

            <Box display="flex" gap={2}>
              <TextField
                label="Duration"
                type="number"
                value={durationValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setDurationValue("");
                    return;
                  }
                  if (/^[0-9]+$/.test(val)) {
                    setDurationValue(Number(val));
                  }
                }}
                onKeyDown={(e) => {
                  if (["-", "e", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                InputProps={{ inputProps: { min: 1, step: 1 } }}
              />


              <TextField
                select
                label="Unit"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="minutes">Minutes</MenuItem>
                <MenuItem value="hours">Hours</MenuItem>
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="weeks">Weeks</MenuItem>
                <MenuItem value="months">Months</MenuItem>
              </TextField>
            </Box>


            <TextField
              label="Number of Modules"
              type="number"
              value={nbOfModules}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setNbOfModules("");
                  return;
                }
                if (/^[0-9]+$/.test(val)) {
                  const num = Number(val);
                  if (num >= 1 && num <= 5) {
                    setNbOfModules(Number(val));
                  }
                  else {
                    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing === false) {
                      showMessage("PrepPilot can only handle 1 to 5 modules", "warning");
                    }
                  }
                }
              }}
              onKeyDown={(e) => {
                if (["-", "e", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              InputProps={{ inputProps: { min: 1, step: 1 } }}
            />
            <TextField
              label="Number of Sections"
              type="number"
              value={nbOfSections}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setNbOfSections("");
                  return;
                }
                if (/^[0-9]+$/.test(val)) {
                  const num = Number(val);
                  if (num >= 1 && num <= 5) {
                    setNbOfSections(Number(val));
                  }
                  else {
                    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing === false) {
                      showMessage("PrepPilot can only handle 1 to 5 sections", "warning");
                    }
                  }
                }
              }}
              onKeyDown={(e) => {
                if (["-", "e", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              InputProps={{ inputProps: { min: 1, step: 1 } }}
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
