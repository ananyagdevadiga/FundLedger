import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { colors, borderRadius } from "../styles/theme";

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { addToast } = useToast();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      addToast("Signed out successfully", "success");
      setTimeout(() => {
        navigate("/home");
      }, 100);
    } catch (err) {
      navigate("/home");
    }
  };

  const navItem = (path, label, icon) => (
    <Link
      to={path}
      style={{
        padding: "12px 16px",
        borderRadius: borderRadius.md,
        textDecoration: "none",
        color: isActive(path) ? colors.textPrimary : colors.textSecondary,
        background: isActive(path) ? colors.bgCard : "transparent",
        marginBottom: "4px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: isActive(path) ? 500 : 400,
        transition: "all 0.2s ease",
        borderLeft: isActive(path) ? `3px solid ${colors.accentBlue}` : "3px solid transparent",
      }}
    >
      {icon}
      {label}
    </Link>
  );

  // Icons
  const DashboardIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
  const AnnouncementIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>;
  const TransactionIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>;
  const GrantIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>;
  const ProjectIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
  const QRIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>;

  return (
    <aside style={{
      width: "280px",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      background: colors.bgSecondary,
      color: colors.textPrimary,
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      borderRight: `1px solid ${colors.border}`,
      overflowY: "auto",
      zIndex: 100,
    }}>
      <div>
        {/* Logo/Brand */}
        <div style={{
          padding: "0 16px",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <img
            src="/logo2.png"
            alt="FundLedger Logo"
            style={{ width: "40px", height: "40px", borderRadius: borderRadius.md, objectFit: "cover" }}
          />
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, letterSpacing: 1 }}>FundLedger</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          {navItem("/admin", "Dashboard", DashboardIcon)}
          {navItem("/admin/announcements", "Announcements", AnnouncementIcon)}
          {navItem("/admin/transactions", "Transactions", TransactionIcon)}
          {navItem("/admin/grants", "Grant Requests", GrantIcon)}
          {navItem("/admin/projects", "Projects", ProjectIcon)}
          {navItem("/admin/scan", "Scan QR", QRIcon)}
        </nav>

        {/* Back to user site */}
        <Link
          to="/home"
          style={{
            padding: "12px 16px",
            borderRadius: borderRadius.md,
            textDecoration: "none",
            color: colors.textSecondary,
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to User Site
        </Link>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          background: "transparent",
          border: `1px solid ${colors.border}`,
          color: colors.accentRed,
          padding: "12px 16px",
          borderRadius: borderRadius.md,
          cursor: "pointer",
          width: "100%",
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
      </button>
    </aside>
  );
}

export default AdminSidebar;
