// src/pages/superadmin/OrganizationsPage.tsx
// Requires VITE_API_URL in your frontend .env (e.g., VITE_API_URL=http://localhost:3000)

import * as React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import SearchIcon from "@mui/icons-material/Search";
import GroupIcon from "@mui/icons-material/Group";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/** Backend payloads */
type ApiOrg = {
  id: number;
  name: string;
  usersCount: number;
  coursesCount: number;
};
type Organization = {
  id: number;
  name: string;
  usersCount: number;
  coursesCount: number;
};

/** DB user row from OrganizationsService.listInstructors */
type DbInstructor = {
  id: number;
  cognito_sub: string | null;
  organization_id: number | null;
};

/** Enriched instructor row (DB + Cognito), UI-only fields */
type UiInstructor = {
  id: number;
  sub: string | null; // used internally for delete endpoint
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/** Matches AdminCreateUserDto (backend) */
type AdminCreateUserBody = {
  email: string;
  firstName: string;
  lastName: string;
  role: "instructor" | "learner";
  organizationId: number;
};

const api = axios.create({
  baseURL:
    (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000",
});

/** Attach Authorization header if localStorage.jwt exists */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const h = config.headers;
    if (h && typeof (h as AxiosHeaders).set === "function") {
      (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { ...(h as any), Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

export default function OrganizationsPage() {
  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up("sm"));

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");

  // Create org
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");

  // Edit org
  const [editOpen, setEditOpen] = React.useState(false);
  const [editOrg, setEditOrg] = React.useState<Organization | null>(null);
  const [editName, setEditName] = React.useState("");

  // Delete org
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Organization | null>(null);

  // Instructors dialog
  const [instOpen, setInstOpen] = React.useState(false);
  const [instOrg, setInstOrg] = React.useState<Organization | null>(null);
  const [instructors, setInstructors] = React.useState<UiInstructor[]>([]);
  const [instLoading, setInstLoading] = React.useState(false);
  const [instFilter, setInstFilter] = React.useState("");

  // Add Instructor (email + first/last name)
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [creatingInstructor, setCreatingInstructor] = React.useState(false);

  const onAxiosError = (e: unknown, fallback: string) => {
    if (axios.isAxiosError(e)) {
      const ae = e as AxiosError<any>;
      setError(ae.response?.data?.message || ae.message || fallback);
    } else setError(fallback);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ApiOrg[]>("/organizations");
      setOrgs(
        data.map((o) => ({
          id: o.id,
          name: o.name,
          usersCount: o.usersCount,
          coursesCount: o.coursesCount,
        }))
      );
    } catch (e) {
      onAxiosError(e, "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? orgs.filter((o) => o.name.toLowerCase().includes(q)) : orgs;
  }, [orgs, filter]);

  // ---------- Create ----------
  async function createOrg() {
    const name = createName.trim();
    if (!name) return;
    try {
      const { data } = await api.post<ApiOrg>("/organizations", { name });
      setOrgs((prev) => [
        {
          id: data.id,
          name: data.name,
          usersCount: data.usersCount,
          coursesCount: data.coursesCount,
        },
        ...prev,
      ]);
      setCreateName("");
      setCreateOpen(false);
      setSuccess("Organization created");
    } catch (e) {
      onAxiosError(e, "Failed to create organization");
    }
  }

  // ---------- Edit ----------
  function openEdit(o: Organization) {
    setEditOrg(o);
    setEditName(o.name);
    setEditOpen(true);
  }
  async function saveEdit() {
    if (!editOrg) return;
    const newName = editName.trim();
    if (!newName || newName === editOrg.name) {
      setEditOpen(false);
      return;
    }
    try {
      const { data } = await api.patch<ApiOrg>(`/organizations/${editOrg.id}`, {
        name: newName,
      });
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === editOrg.id
            ? {
              id: data.id,
              name: data.name,
              usersCount: data.usersCount,
              coursesCount: data.coursesCount,
            }
            : o
        )
      );
      setSuccess("Organization updated");
      setEditOpen(false);
      setEditOrg(null);
    } catch (e) {
      onAxiosError(e, "Failed to update organization");
    }
  }

  // ---------- Delete ----------
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await api.delete(`/organizations/${toDelete.id}`);
      setOrgs((prev) => prev.filter((o) => o.id !== toDelete.id));
      setSuccess("Organization deleted");
    } catch (e) {
      onAxiosError(e, "Cannot delete organization (has users/courses?)");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  }

  // ---------- Instructors ----------
  async function openInstructors(org: Organization) {
    setInstOrg(org);
    setInstFilter("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setInstructors([]);
    setInstOpen(true);
    await loadInstructors(org.id);
  }

  /** Load DB users, then enrich with Cognito (name/email) */
  async function loadInstructors(orgId: number) {
    setInstLoading(true);
    try {
      const { data: dbUsers } = await api.get<DbInstructor[]>(
        `/organizations/${orgId}/instructors`
      );
      const { data: cognitoInfos } = await api.get<any[]>(
        `/users/by-org/${orgId}`
      );
      const bySub = new Map<string, any>();
      for (const info of cognitoInfos) {
        const subFromAttrs = info?.attributes?.sub;
        if (subFromAttrs) bySub.set(subFromAttrs, info);
      }
      const uiRows: UiInstructor[] = dbUsers.map((u) => {
        const info = u.cognito_sub ? bySub.get(u.cognito_sub) : null;
        return {
          id: u.id,
          sub: u.cognito_sub ?? null,
          email: info?.attributes?.email ?? null,
          firstName: info?.attributes?.given_name ?? null,
          lastName: info?.attributes?.family_name ?? null,
        };
      });
      setInstructors(uiRows);
    } catch (e) {
      onAxiosError(e, "Failed to load instructors");
    } finally {
      setInstLoading(false);
    }
  }

  // Create brand-new instructor (Email + First/Last name)
  async function createInstructorInline() {
    if (!instOrg) return;
    const cleanEmail = email.trim();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    if (!cleanEmail || !cleanFirst || !cleanLast) {
      setError("Email, First name and Last name are required");
      return;
    }
    const payload: AdminCreateUserBody = {
      email: cleanEmail,
      firstName: cleanFirst,
      lastName: cleanLast,
      role: "instructor",
      organizationId: instOrg.id,
    };

    setCreatingInstructor(true);
    try {
      await api.post("/users/admin-create", payload);
      await loadInstructors(instOrg.id);
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === instOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o
        )
      );
      setEmail("");
      setFirstName("");
      setLastName("");
      setSuccess("Instructor created and attached to organization");
    } catch (e) {
      onAxiosError(e, "Failed to create instructor");
    } finally {
      setCreatingInstructor(false);
    }
  }

  // Delete user entirely (Cognito + DB) by sub
  async function deleteInstructorEverywhere(sub: string | null) {
    if (!instOrg || !sub) return;
    try {
      await api.delete(`/users/${encodeURIComponent(sub)}`);
      await loadInstructors(instOrg.id);
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === instOrg.id
            ? { ...o, usersCount: Math.max(0, o.usersCount - 1) }
            : o
        )
      );
      setSuccess(`Instructor deleted`);
    } catch (e) {
      onAxiosError(e, "Failed to delete instructor");
    }
  }

  const filteredInstructors = React.useMemo(() => {
    const q = instFilter.trim().toLowerCase();
    if (!q) return instructors;
    return instructors.filter(
      (i) =>
        (i.firstName ?? "").toLowerCase().includes(q) ||
        (i.lastName ?? "").toLowerCase().includes(q) ||
        (i.email ?? "").toLowerCase().includes(q) ||
        String(i.id).includes(q)
    );
  }, [instructors, instFilter]);

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <BusinessIcon color="primary" />
          <Typography variant="h5">Organizations</Typography>
          {loading && <Chip size="small" label="Loading…" />}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            placeholder="Search organizations…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            New Organization
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size={upSm ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell align="right">Courses</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ width: 280 }}>
                  <Typography variant="subtitle2">{o.name}</Typography>
                </TableCell>
                <TableCell align="right">{o.usersCount}</TableCell>
                <TableCell align="right">{o.coursesCount}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Tooltip title="Edit Organization">
                    <IconButton onClick={() => openEdit(o)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Manage Instructors">
                    <IconButton onClick={() => openInstructors(o)}>
                      <GroupIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Organization">
                    <IconButton
                      color="error"
                      onClick={() => {
                        setToDelete(o);
                        setConfirmOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography align="center" color="text.secondary">
                    No organizations found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>New Organization</DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            display: "grid",
            gap: 2,
            minWidth: { xs: 320, sm: 420 },
          }}
        >
          <TextField
            autoFocus
            label="Organization name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g., Stark Industries"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createOrg}
            disabled={!createName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit organization</DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            display: "grid",
            gap: 2,
            minWidth: { xs: 320, sm: 420 },
          }}
        >
          <TextField
            autoFocus
            label="Organization name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Organization name"
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={saveEdit}
            disabled={!editName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{toDelete?.name}</strong>?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Instructors dialog */}
      <Dialog
        open={instOpen}
        onClose={() => setInstOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupIcon />
          Manage Instructors {instOrg ? `— ${instOrg.name}` : ""}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
          {/* Add Instructor (Email + First/Last) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200, // adjust depending on how much vertical space you want
            }}
          >
            <Box sx={{ maxWidth: 800, width: "100%" }}>
              <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>Add Instructor</Typography>
              <Grid container spacing={1} justifyContent="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={createInstructorInline}
                    disabled={
                      creatingInstructor ||
                      !email.trim() ||
                      !firstName.trim() ||
                      !lastName.trim()
                    }
                    sx={{ width: "100%", minWidth: 300 }}
                  >
                    {creatingInstructor ? "Creating…" : "Add"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Divider />

          {/* Filter */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
          >
            <SearchIcon fontSize="small" />
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by First name, Last name, Email, or ID…"
              value={instFilter}
              onChange={(e) => setInstFilter(e.target.value)}
            />
            {instLoading && <Chip size="small" label="Loading…" />}
          </Stack>

          {/* List */}
          <List
            dense
            sx={{
              bgcolor: "background.paper",
              borderRadius: 1,
              maxHeight: 420,
              overflow: "auto",
            }}
          >
            {filteredInstructors.map((i) => (
              <ListItem
                key={`${i.id}-${i.sub ?? ""}`}
                secondaryAction={
                  i.sub && (
                    <Tooltip title="Delete instructor (Cognito + DB)">
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => deleteInstructorEverywhere(i.sub!)}
                      >
                        <PersonOffIcon />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                <ListItemText
                  primary={
                    `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() ||
                    i.email ||
                    `User #${i.id}`
                  }
                  secondary={[
                    i.email ? `Email: ${i.email}` : null,
                    `User ID: ${i.id}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              </ListItem>
            ))}
            {filteredInstructors.length === 0 && (
              <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                {instLoading ? "Loading…" : "No instructors found."}
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3500}
        onClose={() => setSuccess(null)}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
