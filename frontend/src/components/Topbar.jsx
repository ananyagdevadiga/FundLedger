import { colors, spacing } from "../styles/theme";

function Topbar({ isAdmin = false }) {
  return (
    <header style={headerStyle}>
      <div style={{ 
        flex: 1,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
      }}>
        <span style={{ 
          color: colors.textMuted, 
          fontSize: "13px", 
          fontWeight: 600 
        }}>
          {isAdmin ? "Admin Control Panel" : "This organization has made their finances public"}
        </span>
      </div>
    </header>
  );
}

const headerStyle = {
  height: "48px",
  background: colors.bgSecondary,
  borderBottom: `1px solid ${colors.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `0 ${spacing.lg}`,
};

export default Topbar;
