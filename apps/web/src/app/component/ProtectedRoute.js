"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !token)
            router.push("/login");
    }, [loading, token, router]);
    if (loading)
        return <div>Loading...</div>;
    return <>{children}</>;
}
