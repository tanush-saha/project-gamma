import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useStudy } from "./main.jsx";
import { useAuth } from "./auth-context.jsx";

export function StudyShelfApp() {
  const { user, loading } = useAuth();

  useEffect(() => {
  }, [user, loading]);

  if (loading) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Outlet />;
  }

  // Authenticated user - render protected routes
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="cursor-ready">
        <Outlet />
      </body>
    </html>
  );
}