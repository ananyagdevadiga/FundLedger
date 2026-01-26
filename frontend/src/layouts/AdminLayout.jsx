import AdminSidebar from "../components/AdminSidebar";
import Topbar from "../components/Topbar";
import { colors, spacing } from "../styles/theme";

function AdminLayout({ children }) {
  return (
    <div style={layoutContainer}>
      <AdminSidebar />
      <div style={mainContent}>
        <Topbar isAdmin />
        <main style={contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
} 

const layoutContainer = {
  display: "flex",
  minHeight: "100vh",
  background: colors.bgPrimary,
};

const mainContent = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  color: colors.textPrimary,
  minWidth: 0,
  marginLeft: "280px", // Account for fixed sidebar
};

const contentArea = {
  padding: spacing.lg,
  paddingLeft: 100,
  paddingRight: 100,
  flex: 1,
  overflowY: "auto",
};

export default AdminLayout;
