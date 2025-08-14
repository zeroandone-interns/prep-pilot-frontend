import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Button,
    TextField,
    Typography,
    Card,
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
        navigate("/chatbot");
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

                        <Typography variant="h4" fontWeight={700} component="div" sx={{ lineHeight: 1.2 }}>
                            Welcome to PrepPilot!
                            <Typography
                                component="div"      // forces a block (new line)
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: 400, lineHeight: 1.3 }}
                            >
                                Your personal AI-powered learning assistant
                            </Typography>
                        </Typography>


                        <form onSubmit={handleSubmit}>
                            <TextField label="Email" type="email" fullWidth margin="normal" />
                            <TextField label="Password" type="password" fullWidth margin="normal" />

                            <Box sx={{ textAlign: "right", mt: 0.5 }}>
                                <Link component={RouterLink} to="/email-verification">
                                    Forgot Password?
                                </Link>
                            </Box>

                            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                                Sign In
                            </Button>
                        </form>
                    </Box>

                    {/* RIGHT SIDE IMAGE */}
                    <Box className="signup-right">
                        <img src="/signin-image.png" alt="Illustration" className="signup-image" />
                    </Box>

                </Box>
            </Card>
        </Box>

    );
}
