// src/pages/signin/EmailVerification.tsx
import { useState, useEffect, useRef } from "react";
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
    Stack,
} from "@mui/material";

import "./Signup.css"; // reuse existing layout CSS

const CODE_LENGTH = 6;

export default function EmailVerification() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [resendTimer, setResendTimer] = useState(0);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const navigate = useNavigate();

    const { showMessage } = useSnackbar();

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend code
    useEffect(() => {
        if (resendTimer === 0) return;

        const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timerId);
    }, [resendTimer]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSendCode = () => {
        if (!email) {
            showMessage("Please enter your email", "info");
            return;
        }
        // TODO: Call backend API to send code
        setIsCodeSent(true);
        setResendTimer(60);
    };

    const handleResendCode = () => {
        if (resendTimer > 0) return;
        // TODO: Call backend API to resend code
        setResendTimer(30);
    };

    // Handle code digit input change
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, idx: number) => {
        const val = e.target.value;
        if (!/^\d?$/.test(val)) return; // only allow digits or empty

        const newCode = [...code];
        newCode[idx] = val;
        setCode(newCode);

        // Auto-focus next input if digit entered
        if (val && idx < CODE_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    // Handle backspace to move focus back
    const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>, idx: number) => {
        if (e.key === "Backspace" && !code[idx] && idx > 0) {
            const prevInput = inputRefs.current[idx - 1];
            prevInput?.focus();
        }
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        const enteredCode = code.join("");
        if (enteredCode.length !== CODE_LENGTH) {
            showMessage(`Please enter the ${CODE_LENGTH}-digit code`, "info");
            return;
        }

        // TODO: Call backend API to verify the code

        // On success navigate to create-password page
        navigate("/create-password");
    };

    return (
        <Box
            className="signup-page"
            sx={{ bgcolor: "background.default", color: "text.primary" }}
        >
            <Box className="signup-container" maxWidth={400}>
                <Card>
                    <CardHeader
                        title={
                            <Typography variant="h5" color="primary" fontWeight={600}>
                                Email Verification
                            </Typography>
                        }
                    />
                    <CardContent>
                        {!isCodeSent ? (
                            <>
                                <TextField
                                    label="Email"
                                    type="email"
                                    required
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    value={email}
                                    onChange={handleEmailChange}
                                    autoComplete="off"
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={handleSendCode}
                                >
                                    Send Code
                                </Button>
                            </>
                        ) : (
                            <form onSubmit={handleVerifyCode}>
                                <Typography mb={1} variant="body2">
                                    Enter the 6-digit code sent to your email
                                </Typography>
                                <Stack direction="row" spacing={1} justifyContent="center" mb={2}>
                                    {code.map((digit, idx) => (
                                        <TextField
                                            key={idx}
                                            inputProps={{
                                                maxLength: 1,
                                                style: { textAlign: "center", fontSize: "1.5rem", width: "3rem" },
                                            }}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(e, idx)}
                                            onKeyDown={(e) => handleCodeKeyDown(e, idx)}
                                            inputRef={(el) => (inputRefs.current[idx] = el)}
                                            required
                                            autoFocus={idx === 0}
                                            type="text"
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                >
                                    Verify Code
                                </Button>
                                <Button
                                    variant="text"
                                    color="secondary"
                                    fullWidth
                                    onClick={handleResendCode}
                                    disabled={resendTimer > 0}
                                >
                                    {resendTimer > 0
                                        ? `Resend code in ${resendTimer}s`
                                        : "Resend Code"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
