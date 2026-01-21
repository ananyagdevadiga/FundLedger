import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { Link } from "react-router-dom";
import { colors, spacing, borderRadius, cardStyle as themeCard, tableStyles } from "../../styles/theme";

function AdminHome() {
  const [stats, setStats] = useState({
    totalFund: 0,
    totalTransactions: 0,
    pendingGrants: 0,
    projectsCount: 0,
    announcementsCount: 0
  });
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: txnData } = await supabase
        .from("transactions")
        .select("id, txn_id, title, amount, type, created_at")
        .order("created_at", { ascending: false });

      // Calculate total fund
      let balance = 0;
      (txnData || []).forEach(txn => {
        if (txn.type === "credit") balance += Number(txn.amount);
        if (txn.type === "debit") balance -= Number(txn.amount);
      });

      // Fetch pending grants count
      const { count: pendingCount } = await supabase
        .from("grant_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Fetch announcements count
      const { count: announcementsCount } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true });

      setStats({
        totalFund: balance,
        totalTransactions: txnData?.length || 0,
        pendingGrants: pendingCount || 0,
        projectsCount: projectsCount || 0,
        announcementsCount: announcementsCount || 0
      });

      setRecentTxns((txnData || []).slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerSection}>
        <div>
          <h1 style={pageTitle}>Admin Dashboard</h1>
          <p style={pageSubtitle}>Overview of your organization's finances</p>
        </div>
      </div>

      {loading ? (
        <p style={muted}>Loading dashboard...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={statsGrid}>
            <div style={statCard}>
              <div style={statHeader}>
                <span style={statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accentGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <text x="2" y="17" fontSize="18" fill={colors.accentGreen}>₹</text>
                  </svg>
                </span>
                <span style={statLabel}>Total Fund</span>
              </div>
              <h2 style={{ ...statValue, color: colors.accentGreen }}>₹{stats.totalFund.toLocaleString()}</h2>
            </div>

            <div style={statCard}>
              <div style={statHeader}>
                <span style={statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accentBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </span>
                <span style={statLabel}>Transactions</span>
              </div>
              <h2 style={statValue}>{stats.totalTransactions}</h2>
            </div>

            <div style={statCard}>
              <div style={statHeader}>
                <span style={statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stats.pendingGrants > 0 ? colors.accentYellow : colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <span style={statLabel}>Pending Grants</span>
              </div>
              <h2 style={{ ...statValue, color: stats.pendingGrants > 0 ? colors.accentYellow : colors.textPrimary }}>
                {stats.pendingGrants}
              </h2>
            </div>

            <div style={statCard}>
              <div style={statHeader}>
                <span style={statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.accentPurple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                <span style={statLabel}>Projects</span>
              </div>
              <h2 style={statValue}>{stats.projectsCount}</h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={actionsSection}>
            <h3 style={sectionTitle}>Quick Actions</h3>
            <div style={actionsGrid}>
              <Link to="/admin/transactions" style={actionCard}>
                <div style={{ ...actionIcon, background: `${colors.accentGreen}15`, color: colors.accentGreen }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span>Add Transaction</span>
              </Link>
              <Link to="/admin/announcements" style={actionCard}>
                <div style={{ ...actionIcon, background: `${colors.accentBlue}15`, color: colors.accentBlue }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <span>Post Announcement</span>
              </Link>
              <Link to="/admin/projects" style={actionCard}>
                <div style={{ ...actionIcon, background: `${colors.accentPurple}15`, color: colors.accentPurple }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <span>Create Project</span>
              </Link>
              <Link to="/admin/grants" style={{
                ...actionCard,
                background: stats.pendingGrants > 0 ? `${colors.accentYellow}15` : themeCard.background,
                border: stats.pendingGrants > 0 ? `1px solid ${colors.accentYellow}50` : themeCard.border,
              }}>
                <div style={{ ...actionIcon, background: `${colors.accentYellow}15`, color: colors.accentYellow }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <span>Review Grants ({stats.pendingGrants})</span>
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={themeCard}>
            <div style={tableHeader}>
              <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Recent Transactions</h3>
              <Link to="/admin/transactions" style={viewAllLink}>
                View All →
              </Link>
            </div>

            {recentTxns.length === 0 ? (
              <p style={muted}>No transactions yet</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableStyles.header}>Date</th>
                    <th style={tableStyles.header}>Title</th>
                    <th style={tableStyles.header}>QR Code</th>
                    <th style={{ ...tableStyles.header, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map(txn => (
                    <tr key={txn.id} style={tableStyles.row}>
                      <td style={tableStyles.cellMuted}>
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td style={tableStyles.cell}>{txn.title || "—"}</td>
                      <td style={tableStyles.cell}>
                        <button
                          onClick={() => {
                            // Show QR code modal (implement as needed)
                            window.alert(`Txn ID: ${txn.txn_id}`);
                          }}
                          title="View QR Code"
                          style={{
                            background: colors.bgSecondary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: borderRadius.sm,
                            padding: 6,
                            color: colors.textPrimary,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                          </svg>
                        </button>
                      </td>
                      <td style={{
                        ...tableStyles.cell,
                        textAlign: "right",
                        color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                        fontWeight: 600
                      }}>
                        {txn.type === "credit" ? "+" : "-"}₹{Number(txn.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

/* ---------- styles ---------- */

const headerSection = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.xl,
};

const headerIcon = {
  width: "48px",
  height: "48px",
  borderRadius: borderRadius.md,
  background: `linear-gradient(135deg, ${colors.accentYellow}20, ${colors.accentBlue}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentYellow,
};

const pageTitle = {
  fontSize: "28px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
};

const pageSubtitle = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: "4px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: spacing.md,
  marginBottom: spacing.xl,
};

const statCard = {
  ...themeCard,
  padding: spacing.lg,
};

const statHeader = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.md,
};

const statIcon = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statLabel = {
  fontSize: "13px",
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValue = {
  fontSize: "32px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
};

const actionsSection = {
  marginBottom: spacing.xl,
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.md,
};

const actionsGrid = {
  display: "flex",
  gap: spacing.md,
  flexWrap: "wrap",
};

const actionCard = {
  ...themeCard,
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: `${spacing.md} ${spacing.lg}`,
  textDecoration: "none",
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: 500,
  transition: "transform 0.2s, box-shadow 0.2s",
};

const actionIcon = {
  width: "32px",
  height: "32px",
  borderRadius: borderRadius.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const tableHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
};

const viewAllLink = {
  color: colors.accentBlue,
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
};

const txnIdCell = {
  ...tableStyles.cellMuted,
  fontFamily: "monospace",
  fontSize: "13px",
  background: colors.bgSecondary,
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  display: "inline-block",
};

const muted = {
  color: colors.textMuted,
  fontSize: "14px",
};

export default AdminHome;
