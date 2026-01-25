import UserSidebar from "../components/UserSidebar";
import Topbar from "../components/Topbar";
import { colors, spacing } from "../styles/theme";

function UserLayout({ children }) {
  return (
    <div style={layoutContainer}>
      <UserSidebar />
      <div style={mainContent}>
        <Topbar />
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
  minWidth: 0, // Prevents flex item from overflowing
  marginLeft: "280px", // Account for fixed sidebar
};

const contentArea = {
  padding: "32px 108px", // 48 + 60 = 108 for 100px extra on both sides
  flex: 1,
  overflowY: "auto",
};

export default UserLayout;
