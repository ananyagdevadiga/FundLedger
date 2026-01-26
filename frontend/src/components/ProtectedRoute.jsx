import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./Spinner";

// For admin-only routes
export function AdminRoute({ children }) {
  const { user, role, loading, roleLoading } = useAuth();

  // Show blocking spinner only if we truly don't have any role info yet.
  if (loading || (roleLoading && !role)) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0b0e14", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        color: "white" 
      }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// For logged-in users only (like request grant)
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0b0e14", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        color: "white" 
      }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
