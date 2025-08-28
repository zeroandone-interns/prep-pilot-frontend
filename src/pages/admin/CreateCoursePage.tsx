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
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Link as LinkIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "@/components/SnackbarProvider";
import axios from "axios";
import Dropzone from "react-dropzone";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [durationValue, setDurationValue] = React.useState<number | "">("");
  const [durationUnit, setDurationUnit] = React.useState("hours");
  const [nbOfModules, setNbOfModules] = React.useState<number | "">("");
  const [nbOfSections, setNbOfSections] = React.useState<number | "">("");
  const [documents, setDocuments] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadingDocs, setUploadingDocs] = React.useState(false);

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

    // Validate required fields
    if (
      !title.trim() ||
      !description.trim() ||
      !level.trim() ||
      durationValue === "" ||
      nbOfModules === "" ||
      nbOfSections === ""
    ) {
      showMessage("Please fill all required fields", "error");
      return;
    }

    // Require at least one document
    if (documents.length === 0) {
      showMessage("Please upload at least one document", "error");
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

      const courseId = CreatedCourse.data.id;
      showMessage("Course generation requested, the process may take some time", "warning");

      if (documents.length > 0) {
        setUploadingDocs(true);
        const formData = new FormData();
        documents.forEach((file) => formData.append("files", file));

        try {
          const response = await axios.post(
            `${BaseUrl}/courses/upload/${courseId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          console.log("Upload response:", response.data);
          showMessage("course generated successfully!", "success");
        } catch (err) {
          console.error(err);
          showMessage("Failed to upload files", "error");
        } finally {
          setUploadingDocs(false);
        }
      }

      navigate("/admin/courses");
    } catch (err) {
      console.error(err);
      showMessage("Failed to create course.", "error");
      setLoading(false);
      setUploadingDocs(false);
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
              required
            />
            <TextField
              label="Description / Prompt"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              helperText="Describe the topic and scope."
              required
            />
            <TextField
              label="Level"
              select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
            >
              <MenuItem value="">Select a level</MenuItem>
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
                  if (["-", "e", "."].includes(e.key)) e.preventDefault();
                }}
                InputProps={{ inputProps: { min: 1, step: 1 } }}
                required
              />
              <TextField
                select
                label="Unit"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                sx={{ minWidth: 120 }}
                required
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
                  if (num >= 1 && num <= 5) setNbOfModules(num);
                  else
                    showMessage(
                      "PrepPilot can only handle 1 to 5 modules",
                      "warning"
                    );
                }
              }}
              onKeyDown={(e) => {
                if (["-", "e", "."].includes(e.key)) e.preventDefault();
              }}
              InputProps={{ inputProps: { min: 1, max: 5, step: 1 } }}
              required
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
                  if (num >= 1 && num <= 5) setNbOfSections(num);
                  else
                    showMessage(
                      "PrepPilot can only handle 1 to 5 sections",
                      "warning"
                    );
                }
              }}
              onKeyDown={(e) => {
                if (["-", "e", "."].includes(e.key)) e.preventDefault();
              }}
              InputProps={{ inputProps: { min: 1, max: 5, step: 1 } }}
              required
            />

            <Divider textAlign="left">
              <LinkIcon fontSize="small" /> Documents
            </Divider>

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

            {uploadingDocs && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} />
                <Typography>Uploading documents...</Typography>
              </Box>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/courses")}
                disabled={loading || uploadingDocs}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={
                  !title.trim() ||
                  !description.trim() ||
                  !level.trim() ||
                  durationValue === "" ||
                  nbOfModules === "" ||
                  nbOfSections === "" ||
                  documents.length === 0 ||
                  loading ||
                  uploadingDocs
                }
                sx={{
                  "&.Mui-disabled": {
                    color: "#fff", // white text
                    opacity: 0.5,
                  },
                }}
              >
                {loading || uploadingDocs ? "Processing..." : "Generate"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
