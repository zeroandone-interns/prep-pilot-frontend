// src/pages/signin/CreatePassword.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "@/components/SnackbarProvider";
import {
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Box,
} from "@mui/material";
import "./Signup.css";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function CreatePassword() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.Auth.session);
  const email = useSelector((state: RootState) => state.Auth.email);

  const { showMessage } = useSnackbar();

  useEffect(() => {
    if (!session || !email) {
      navigate("/");
    }
  }, [session, email, navigate]);

  // Cognito password rules
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setPasswordError("");
    setConfirmError("");
    if (!loading) {
      handleSetPassword();
    }

  };

  const handleSetPassword = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${BaseUrl}/users/complete-new-password`,
        {
          email,
          session,
          newPassword: password,
        }
      );

      console.log(response)

      if (response.data.message === "Password updated & login successful") {
        navigate("/");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        showMessage(error.response?.data?.message || "Something went wrong", "error");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <Box
      className="signup-page"
      sx={{ bgcolor: "background.default", color: "text.primary" }}
    >
      <Card>
        <CardHeader
          title={
            <Typography variant="h5" color="primary">
              Create Password
            </Typography>
          }
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Set New Password"
              type="password"
              required
              fullWidth
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              autoComplete="new-password"
            />
            <TextField
              label="Confirm Password"
              type="password"
              required
              fullWidth
              variant="outlined"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmError}
              helperText={confirmError}
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
