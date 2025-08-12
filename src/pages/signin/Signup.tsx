// src/pages/Signup.tsx
import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Box,
    Link
} from "@mui/material";

import "./Signup.css";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Sign-up API logic
        navigate("/login");
    };

    return (
        <Box className="signup-page" sx={{ bgcolor: "background.default", color: "text.primary" }}>
            <Box className="signup-container">
                <div className="signup-logo">
                    <img src="/logo.png" alt="Logo" className="icon" />
                </div>
                <Card>
                    <CardHeader
                        title={
                            <Typography variant="h5" color="primary">
                                Login
                            </Typography>
                        }
                    />
                    <CardContent>
                        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
                            <TextField
                                label="Email"
                                type="email"
                                required
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                            />
                            <TextField
                                label="Password"
                                type="password"
                                required
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                Submit
                            </Button>
                        </form>

                        <Box mt={2}>
                            <Link
                            component={RouterLink}
                            to="/email-verification"
                            underline="hover"
                            align="left"
                            color="secondary"
                            fontWeight={500}
                            >
                                Create password
                            </Link>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}