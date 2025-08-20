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
} from "@mui/material";
import { PersonAdd, Delete } from "@mui/icons-material";
import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminUsers() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [open, setOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "learner" as "learner" | "admin",
  });
  const [organizationId, setOrganizationId] = useState();

  // Start with empty array
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

  const handleDelete = async (sub: string) => {
    try {
      await axios.delete(`${BaseUrl}/users/${sub}`);
      // Remove deleted user from state
      setUsers((prev) => prev.filter((u) => u.sub !== sub));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const fetchUsers = async () => {
    if (!sub) {
      alert("User not found in localStorage.");
      return;
    }

    console.log("sub", sub);

    try {
      // Get current user info
      const userRes = await axios.get(`${BaseUrl}/users/by-sub-db/${sub}`);
      const user = userRes.data;
      const { id: userId, organization_id: organizationId } = user;

      console.log(userId, organizationId);

      if (!userId || !organizationId) {
        throw new Error("Missing userId or organizationId from backend.");
      }
      setOrganizationId(organizationId);
      // Get all users in organization
      const usersResult = await axios.get(
        `${BaseUrl}/users/by-org/${organizationId}`
      );

      console.log(usersResult);

      // Map to extract attributes
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
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      const AddedUser = await axios.post(
        `${BaseUrl}/users/admin-create`,
        {
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          role: addForm.role,
          email: addForm.email,
          organizationId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(AddedUser);
      alert("User was added!");
      fetchUsers();
    } catch (error) {
      console.log(error);
    }
  };

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

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            display: "grid",
            gap: 2,
            minWidth: { xs: 320, sm: 420 },
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
              <MenuItem value="instructor">instructor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
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
