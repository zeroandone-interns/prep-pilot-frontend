// src/signin/Signup.tsx
import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Button, TextField, Typography, Card, Box, Link } from "@mui/material";
import "./Signup.css";
import axios from "axios";
import { type AppDispatch } from "@/store";
import { useDispatch } from "react-redux";
import { setAuth } from "@/store/AuthSlice";
import { useSnackbar } from "@/components/SnackbarProvider";

export default function Signup() {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // NEW STATE

  const { showMessage } = useSnackbar();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setLoading(true); // start loading

    try {
      const response = await axios.post(
        `${BaseUrl}/users/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.message === "Login successful") {
        localStorage.setItem("token", response.data.accessToken);
      } else if (response.data.challenge === "NEW_PASSWORD_REQUIRED") {
        dispatch(setAuth({ session: response.data.session, email }));
        navigate("/create-password");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const result = await axios.get(`${BaseUrl}/users/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (result.data.message === "Token is valid") {
          localStorage.setItem("sub", result.data.user.sub);
          localStorage.setItem("groups", result.data.user.groups);
        }

        if (localStorage.getItem("groups")?.includes("instructor")) {
          navigate("/admin/courses");
        } else if (localStorage.getItem("groups")?.includes("SuperAdmin")) {
          navigate("/organizations");
        } else {
          navigate("/courses");
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        showMessage(error.response?.data?.message || "Something went wrong", "error");
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false); // stop loading after request finishes
    }
  };

  return (
    <Box className="signup-page">
      <Card className="signup-card">
        <Box className="signup-container">
          {/* LEFT SIDE */}
          <Box className="signup-left">
            <Box className="signup-logo">
              <img src="/new_logo_3.png" alt="Logo" className="icon" />
            </Box>

            <Typography
              variant="h4"
              fontWeight={700}
              component="div"
              sx={{ lineHeight: 1.2 }}
            >
              Welcome to PrepPilot!
              <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 400, lineHeight: 1.3 }}
              >
                Your personal AI-powered learning assistant
              </Typography>
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                onChange={(e) => setPassword(e.target.value)}
              />

              <Box sx={{ textAlign: "right", mt: 0.5 }}>
                <Link component={RouterLink} to="/email-verification">
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading} // disable when loading
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Box>

          {/* RIGHT SIDE IMAGE */}
          <Box className="signup-right">
            <img
              src="/signin-image.png"
              alt="Illustration"
              className="signup-image"
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
