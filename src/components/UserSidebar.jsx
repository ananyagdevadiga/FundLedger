import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItem = (path, label) => (
    <Link
      to={path}
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: location.pathname === path ? "#fff" : "#9ca3af",
        background: location.pathname === path ? "#1f2933" : "transparent",
        marginBottom: "6px",
        display: "block"
      }}
    >
      {label}
    </Link>
  );

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut();
    navigate("/home");
    setIsSigningOut(false);
  };

  return (
    <div style={{
      width: "260px",
      background: "#0b0e14",
      color: "white",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      borderRight: "1px solid #1f2933"
    }}>
      <div>
        <h2 style={{ marginBottom: "30px", fontWeight: 600 }}>MyOrg</h2>

        {navItem("/home", "Home")}
        {navItem("/announcements", "Announcements")}
        {navItem("/transactions", "Transactions")}
        {navItem("/request-grant", "Request Grant")}
        {navItem("/scan", "Scan QR")}
        
        {role === "admin" && (
          <Link
            to="/admin"
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#fbbf24",
              background: "#1f2933",
              marginTop: "12px",
              display: "block"
            }}
          >
            ⚙️ Admin Panel
          </Link>
        )}
      </div>

      <div>
        {user ? (
          <>
            <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
              {user.email}
            </p>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              style={{
                background: "transparent",
                border: "1px solid #1f2933",
                color: "#f87171",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: isSigningOut ? "not-allowed" : "pointer",
                width: "100%",
                opacity: isSigningOut ? 0.6 : 1
              }}
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            style={{ 
              background: "#4ade80",
              color: "#000",
              textDecoration: "none", 
              display: "block",
              padding: "10px 12px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: 600
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

export default UserSidebar;
