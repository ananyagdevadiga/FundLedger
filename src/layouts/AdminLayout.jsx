import AdminSidebar from "../components/AdminSidebar";
import Topbar from "../components/Topbar";

function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div style={{ flex: 1, background: "#0b0e14", color: "white" }}>
        <Topbar />
        <div style={{ padding: "20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
