// src/pages/CreatePassword.tsx
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
    Link,
} from "@mui/material";

import "./Signup.css";

export default function CreatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        // TODO: Call your password creation API here

        // On success, navigate to login page
        navigate("/signup");
    };

    return (
        <Box className="signup-page" sx={{ bgcolor: "background.default", color: "text.primary" }}>
            <Box className="signup-container">
                <div className="signup-logo">
                    <img src="/logo.png" alt="Logo" className="icon" />
                </div>
                <Card>
                    <CardHeader
                        title={<Typography variant="h5" color="primary">Create Password</Typography>}
                    />
                    <CardContent>
                        <form onSubmit={handleSubmit} className="create-password-form">
                            <TextField
                                label="Create Password"
                                type="password"
                                required
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                autoComplete="new-password"
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                Save Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
