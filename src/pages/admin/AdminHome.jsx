import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { Link } from "react-router-dom";

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
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Admin Dashboard</h1>

      {loading ? (
        <p style={muted}>Loading dashboard...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 30 }}>
            <div style={statCard}>
              <p style={muted}>Total Fund</p>
              <h2 style={{ fontSize: 32, color: "#4ade80" }}>₹{stats.totalFund.toLocaleString()}</h2>
            </div>

            <div style={statCard}>
              <p style={muted}>Transactions</p>
              <h2 style={{ fontSize: 32 }}>{stats.totalTransactions}</h2>
            </div>

            <div style={statCard}>
              <p style={muted}>Pending Grants</p>
              <h2 style={{ fontSize: 32, color: stats.pendingGrants > 0 ? "#fbbf24" : "white" }}>
                {stats.pendingGrants}
              </h2>
            </div>

            <div style={statCard}>
              <p style={muted}>Projects</p>
              <h2 style={{ fontSize: 32 }}>{stats.projectsCount}</h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/admin/transactions" style={actionBtn}>+ Add Transaction</Link>
              <Link to="/admin/announcements" style={actionBtn}>+ Post Announcement</Link>
              <Link to="/admin/projects" style={actionBtn}>+ Create Project</Link>
              <Link to="/admin/grants" style={{ ...actionBtn, background: stats.pendingGrants > 0 ? "#fbbf24" : "#1f2933", color: stats.pendingGrants > 0 ? "#000" : "#fff" }}>
                Review Grants ({stats.pendingGrants})
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3>Recent Transactions</h3>
              <Link to="/admin/transactions" style={{ color: "#60a5fa", textDecoration: "none" }}>
                View All →
              </Link>
            </div>

            {recentTxns.length === 0 ? (
              <p style={muted}>No transactions yet</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #1f2933" }}>
                    <th style={{ paddingBottom: 10 }}>Date</th>
                    <th style={{ paddingBottom: 10 }}>Title</th>
                    <th style={{ paddingBottom: 10 }}>Txn ID</th>
                    <th style={{ paddingBottom: 10, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map(txn => (
                    <tr key={txn.id} style={{ borderBottom: "1px solid #1f2933" }}>
                      <td style={{ padding: "12px 0", color: "#9ca3af", fontSize: 14 }}>
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 0" }}>{txn.title || "—"}</td>
                      <td style={{ padding: "12px 0", color: "#9ca3af", fontSize: 14 }}>{txn.txn_id}</td>
                      <td style={{
                        padding: "12px 0",
                        textAlign: "right",
                        color: txn.type === "credit" ? "#34d399" : "#f87171",
                        fontWeight: 500
                      }}>
                        {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
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

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "20px"
};

const statCard = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "20px"
};

const actionBtn = {
  background: "#1f2933",
  color: "white",
  padding: "10px 16px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default AdminHome;
