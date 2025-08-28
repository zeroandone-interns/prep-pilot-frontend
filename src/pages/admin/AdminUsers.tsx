// src/pages/admin/AdminUsers.tsx
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
  Divider,
} from "@mui/material";
import { PersonAdd, Delete } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { styled, alpha } from "@mui/material/styles";
import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "@/components/SnackbarProvider";
import axios from "axios";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import Menu, { type MenuProps } from "@mui/material/Menu";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "rgb(55, 65, 81)",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": { padding: "4px 0" },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

interface CsvUser {
  FirstName: string;
  LastName: string;
  email: string;
  role: string;
}

export default function AdminUsers() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Dialog state
  const [openForm, setOpenForm] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "learner" as "learner" | "admin",
  });

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
  const [csvUsers, setCsvUsers] = useState<CsvUser[]>([]);
  const sub = localStorage.getItem("sub");

  // ====== User CRUD Handlers ======
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
      const { id: userId, organization_id } = userRes.data;
      if (!userId || !organization_id) throw new Error("Missing IDs");
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
        { ...addForm, organizationId },
        { headers: { "Content-Type": "application/json" } }
      );
      showMessage("User was added!", "success");
      fetchUsers();
    } catch (error: any) {
      showMessage(
        error.response?.data?.message || "Failed to add user",
        "error"
      );
    }
  };

  const handleBulkAddUsers = async () => {
    if (!csvUsers.length) return;
    try {
      for (const u of csvUsers) {
        await axios.post(`${BaseUrl}/users/admin-create`, {
          firstName: u.FirstName,
          lastName: u.LastName,
          email: u.email,
          role: u.role || "learner",
          organizationId,
        });
      }
      showMessage("Users from CSV were added!", "success");
      fetchUsers();
      setCsvUsers([]);
    } catch (err: any) {
      showMessage(
        err.response?.data?.message || "Failed to add users",
        "error"
      );
    }
  };

  // ====== CSV Dropzone ======
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    Papa.parse<CsvUser>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
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
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Users</Typography>

        {/* Menu Button */}
        <Button
          variant="contained"
          disableElevation
          onClick={handleMenuClick}
          endIcon={<KeyboardArrowDownIcon />}
          startIcon={<PersonAdd />}
        >
          Add User
        </Button>
        <StyledMenu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              setOpenForm(true);
              handleMenuClose();
            }}
          >
            <EditIcon /> Add New User
          </MenuItem>
          <MenuItem
            onClick={() => {
              setOpenBulk(true);
              handleMenuClose();
            }}
          >
            <FileCopyIcon /> Add Bulk Users
          </MenuItem>
        </StyledMenu>
      </Box>

      {/* Users Table */}
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
                  <Chip size="small" label={u.role} />
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

      {/* === Dialog 1: Add New User === */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="First name"
            value={addForm.firstName}
            onChange={(e) =>
              setAddForm({ ...addForm, firstName: e.target.value })
            }
            required
          />
          <TextField
            label="Last name"
            value={addForm.lastName}
            onChange={(e) =>
              setAddForm({ ...addForm, lastName: e.target.value })
            }
            required

          />
          <TextField
            label="Email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            required
          />
          <FormControl>
            <InputLabel id="role">Role</InputLabel>
            <Select
              labelId="role"
              value={addForm.role}
              onChange={(e) =>
                setAddForm({
                  ...addForm,
                  role: e.target.value as "learner" | "admin",
                })
              }
              required
            >
              <MenuItem value="learner">Learner</MenuItem>
              <MenuItem value="instructor">Instructor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!addForm.firstName || !addForm.lastName || !addForm.email)
                return;
              handleAddUser();
              setAddForm({
                firstName: "",
                lastName: "",
                email: "",
                role: "learner",
              });
              setOpenForm(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* === Dialog 2: Bulk Add Users === */}
      <Dialog
        open={openBulk}
        onClose={() => setOpenBulk(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Bulk Users</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Box
            {...getRootProps()}
            sx={{
              p: 2,
              border: "2px dashed gray",
              textAlign: "center",
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

          {csvUsers.length > 0 && (
            <TableContainer component={Paper} sx={{ maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvUsers.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.FirstName}</TableCell>
                      <TableCell>{row.LastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulk(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleBulkAddUsers();
              setCsvUsers([]);
              setOpenBulk(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
