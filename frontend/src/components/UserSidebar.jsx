import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { colors, borderRadius } from "../styles/theme";

function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut, profile } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { addToast } = useToast();

  const isActive = (path) => location.pathname === path;

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
        borderLeft: isActive(path) ? `3px solid ${colors.accentGreen}` : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive(path)) {
          e.currentTarget.style.background = colors.bgHover;
          e.currentTarget.style.color = colors.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive(path)) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = colors.textSecondary;
        }
      }}
    >
      {icon}
      {label}
    </Link>
  );

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      await signOut();
      addToast("Signed out successfully", "success");
      setTimeout(() => {
        navigate("/home");
        setIsSigningOut(false);
      }, 100);
    } catch (err) {
      setIsSigningOut(false);
      navigate("/home");
    }
  };

  // Icons as SVG components
  const HomeIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
  const AnnouncementIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>;
  const TransactionIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>;
  const GrantIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;
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
          <img src="/logo2.png" alt="FundLedger Logo" style={{ width: 40, height: 40, borderRadius: borderRadius.md, objectFit: "cover" }} />
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, letterSpacing: -1 }}>FundLedger</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          {navItem("/home", "Home", HomeIcon)}
          {navItem("/announcements", "Announcements", AnnouncementIcon)}
          {navItem("/transactions", "Transactions", TransactionIcon)}
          {navItem("/request-grant", "Request Grant", GrantIcon)}
          {navItem("/scan", "Scan QR", QRIcon)}
        </nav>
        
        {role === "admin" && (
          <Link
            to="/admin"
            style={{
              padding: "12px 16px",
              borderRadius: borderRadius.md,
              textDecoration: "none",
              color: colors.accentYellow,
              background: `${colors.accentYellow}15`,
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 500,
              border: `1px solid ${colors.accentYellow}30`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Admin Panel
          </Link>
        )}
      </div>

      {/* User section */}
      <div style={{ position: "relative" }}>
        {/* Divider */}
        <div style={{ height: "1px", background: colors.border, marginBottom: "12px", marginLeft: "-16px", marginRight: "-16px" }} />
        
        {user ? (
          <>
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                right: 0,
                marginBottom: "8px",
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                padding: "8px 0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                zIndex: 200,
              }}>
                {/* Account Header */}
                <div style={{ 
                  padding: "8px 16px",
                  marginBottom: "4px"
                }}>
                  <span style={{ 
                    fontSize: "11px", 
                    fontWeight: 500, 
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Account
                  </span>
                </div>
                
                {/* Settings Link */}
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: colors.textSecondary,
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.bgHover;
                    e.currentTarget.style.color = colors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Settings
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleSignOut();
                  }}
                  disabled={isSigningOut}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "transparent",
                    border: "none",
                    color: colors.textSecondary,
                    fontSize: "14px",
                    cursor: isSigningOut ? "not-allowed" : "pointer",
                    width: "100%",
                    textAlign: "left",
                    opacity: isSigningOut ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSigningOut) {
                      e.currentTarget.style.background = colors.bgHover;
                      e.currentTarget.style.color = colors.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}

            {/* Clickable User Profile */}
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                padding: "12px 16px",
                cursor: "pointer",
                borderRadius: borderRadius.sm,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: borderRadius.full,
                background: colors.accentRed,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
              }}>
                { (profile?.name || user.email || 'U').toString().charAt(0).toUpperCase() }
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ 
                  color: colors.textPrimary, 
                  fontSize: "14px", 
                  fontWeight: 500,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </p>
                <p style={{ 
                  color: colors.textMuted, 
                  fontSize: "12px", 
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {user.email}
                </p>
              </div>
            </div>
          </>
        ) : (
          <Link 
            to="/login" 
            style={{ 
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: colors.textSecondary,
              fontSize: "14px",
              borderRadius: borderRadius.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.bgHover;
              e.currentTarget.style.color = colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

export default UserSidebar;
