import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/home");
  };

  return (
    <div style={{
      width: "240px",
      background: "#0f1218",
      color: "white",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      <div>
        <h2 style={{ marginBottom: "30px" }}>Admin Panel</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link style={linkStyle} to="/admin">Dashboard</Link>
          <Link style={linkStyle} to="/admin/announcements">Announcements</Link>
          <Link style={linkStyle} to="/admin/transactions">Transactions</Link>
          <Link style={linkStyle} to="/admin/grants">Grant Requests</Link>
          <Link style={linkStyle} to="/admin/projects">Projects</Link>
          <Link style={linkStyle} to="/admin/scan">Scan QR</Link>
        </nav>
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: "transparent",
          border: "1px solid #1f2933",
          color: "#f87171",
          padding: "10px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          width: "100%"
        }}
      >
        Logout
      </button>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "6px 0"
};

export default AdminSidebar;
