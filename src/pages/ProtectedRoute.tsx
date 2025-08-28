// src/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";


const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const result = await axios.get(`${BaseUrl}/users/verify`, {
          withCredentials: true, // if using cookies
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (result.data.message === "Token is valid") {
          setIsValid(true);
        }
      } catch {
        setIsValid(false);
      }
    };
    verifyToken();
  }, []);

  if (isValid === null) return <p>Loading...</p>;
  if (!isValid) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
