import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
} from "@mui/material";
import { PersonAdd, Delete } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "@/components/SnackbarProvider";
import axios from "axios";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";


interface CsvUser {
  FirstName: string;
  LastName: string;
  email: string;
  role: string;
}


export default function AdminUsers() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;


  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "learner" as "learner" | "admin",
  });

  const [csvUsers, setCsvUsers] = useState<any[]>([]);

  const [organizationId, setOrganizationId] = useState<number | undefined>();

  const { showMessage } = useSnackbar();

  const [users, setUsers] = useState<
    {
      sub: string;
      given_name: string;
      family_name: string;
      email: string;
      role: string;
    }[]
  >([]);



  const sub = localStorage.getItem("sub");
  // remove one row locally
const handleRemoveCsvUser = (index: number) => {
  setCsvUsers((prev) => prev.filter((_, i) => i !== index));
};



  const handleDelete = async (sub: string) => {
    try {
      await axios.delete(`${BaseUrl}/users/${sub}`);
      setUsers((prev) => prev.filter((u) => u.sub !== sub));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const fetchUsers = async () => {
    if (!sub) {
      showMessage("User not found in localStorage", "error");

      return;
    }

    setLoading(true);

    try {
      const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
      const user = userRes.data;
      const { id: userId, organization_id } = user;

      if (!userId || !organization_id) {
        throw new Error("Missing userId or organizationId from backend.");
      }

      setOrganizationId(organization_id);

      const usersResult = await axios.get(
        `${BaseUrl}/users/by-org/${organization_id}`
      );

      const mappedUsers = usersResult.data.map((u: any) => ({
        sub: u.attributes.sub,
        given_name: u.attributes.given_name,
        family_name: u.attributes.family_name,
        email: u.attributes.email,
        role: u.groups[0],
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

const handleAddUser = async () => {
  try {
    await axios.post(
      `${BaseUrl}/users/admin-create`,
      {
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        role: addForm.role,
        email: addForm.email,
        organizationId,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    showMessage("User was added!", "success");
    fetchUsers();
  } catch (error: any) {
    console.log(error);

      const msg = error.response?.data?.message;
      showMessage(msg || "Failed to add user", "error");
  }
};


  const handleBulkAddUsers = async () => {
    if (!csvUsers.length) return;
    try {
      for (const u of csvUsers) {
        await axios.post(`${BaseUrl}/users/admin-create`, {
          firstName: u["FirstName"],
          lastName: u["LastName"],
          email: u["email"],
          role: u["role"] || "learner",
          organizationId,
        });
      }
      showMessage("Users from CSV were added!","success");
      fetchUsers();
      setCsvUsers([]);
    } catch (err:any) {
      console.error("Bulk add failed:", err);
       const msg = err.response?.data?.message;
       showMessage(msg || "Failed to add user", "error");
    }
  };

 const onDrop = useCallback((acceptedFiles: File[]) => {
   const file = acceptedFiles[0];
   if (!file) return;

   Papa.parse<CsvUser>(file, {
     header: true,
     skipEmptyLines: true,
     complete: (results) => {
       console.log("Parsed CSV:", results.data);

       // Filter invalid/empty rows and normalize role
       const cleaned = results.data
         .filter(
           (row): row is CsvUser =>
             !!row.FirstName && !!row.LastName && !!row.email
         )
         .map((row) => ({
           ...row,
           role: row.role?.toLowerCase() || "learner",
         }));

       setCsvUsers(cleaned);
       console.log(csvUsers);
     },
     error: (err) => {
       console.error("CSV parsing error:", err);
     },
   });
 }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Users</Typography>
        <Button
          startIcon={<PersonAdd />}
          variant="contained"
          onClick={() => setOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.sub} hover>
                <TableCell>
                  {u.given_name} {u.family_name}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={u.role === "instructor" ? "secondary" : "default"}
                    label={u.role}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(u.sub)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent
          sx={{
            pt: '20px !important',
            display: "grid",
            gap: 2,
            maxHeight: "60vh", 
            overflowY: "auto", 
          }}
        >
          <TextField
            label="First name"
            value={addForm.firstName}
            onChange={(e) =>
              setAddForm({ ...addForm, firstName: e.target.value })
            }
          />
          <TextField
            label="Last name"
            value={addForm.lastName}
            onChange={(e) =>
              setAddForm({ ...addForm, lastName: e.target.value })
            }
          />
          <TextField
            label="Email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          />
          <FormControl>
            <InputLabel id="role">Role</InputLabel>
            <Select
              labelId="role"
              label="Role"
              value={addForm.role}
              onChange={(e) =>
                setAddForm({
                  ...addForm,
                  role: e.target.value as "learner" | "admin",
                })
              }
            >
              <MenuItem value="learner">Learner</MenuItem>
              <MenuItem value="instructor">Instructor</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle1">Or upload CSV</Typography>
          <Box
            {...getRootProps()}
            sx={{
              p: 2,
              border: "2px dashed gray",
              textAlign: "center",
              cursor: "pointer",
              bgcolor: isDragActive ? "action.hover" : "background.paper",
            }}
          >
            <input {...getInputProps()} />
            <Typography>
              {isDragActive
                ? "Drop the CSV here…"
                : "Drag & drop a CSV or click to upload"}
            </Typography>
          </Box>

          {/* CSV preview table */}
          {csvUsers.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 250,
                overflow: "auto", // enable scrollbars
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvUsers.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.FirstName}</TableCell>
                      <TableCell>{row.LastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.role}</TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCsvUser(idx)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (csvUsers.length > 0) {
                handleBulkAddUsers();
              } else {
                if (!addForm.firstName || !addForm.lastName || !addForm.email)
                  return;
                handleAddUser();
              }

              setAddForm({
                firstName: "",
                lastName: "",
                email: "",
                role: "learner",
              });
              setCsvUsers([]);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
