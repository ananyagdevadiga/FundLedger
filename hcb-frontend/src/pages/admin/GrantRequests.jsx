import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { generateTxnId } from "../../utils/txn";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard, buttonPrimary, buttonSecondary } from "../../styles/theme";

function GrantRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);

      let query = supabase
        .from("grant_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
    } catch (err) {
      // Error handled silently
    } finally {
      // Ensure minimum 3 seconds loading time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    }
  };

  const handleApprove = async (request, addToProjects = false) => {
    const confirmMsg = addToProjects 
      ? `Approve grant of ₹${request.amount} for "${request.title}" and add to Projects?`
      : `Approve grant of ₹${request.amount} for "${request.title}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(request.id);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create debit transaction
      const txnId = generateTxnId();
      const { error: txnError } = await supabase.from("transactions").insert([{
        txn_id: txnId,
        title: `Grant: ${request.title}`,
        description: `Approved grant request from ${request.email}. ${request.description || ""}`,
        amount: Number(request.amount),
        type: "debit",
        created_by: user?.id
      }]);

      if (txnError) throw txnError;

      // If addToProjects is true, create project entry
      if (addToProjects) {
        const { error: projectError } = await supabase.from("projects").insert([{
          title: request.title,
          description: request.description,
          user_id: request.user_id,
          created_by: user?.id
        }]);

        if (projectError) {
          addToast("Grant approved but failed to add project", "warning");
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("grant_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      addToast(addToProjects ? "Grant approved and added to projects!" : "Grant approved!", "success");
      fetchRequests();
    } catch (err) {
      addToast("Failed to approve grant", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm(`Reject grant request "${request.title}"?`)) return;

    try {
      setProcessingId(request.id);

      const { error } = await supabase
        .from("grant_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      addToast("Grant request rejected", "success");
      fetchRequests();
    } catch (err) {
      addToast("Failed to reject grant", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: `${colors.accentYellow}20`, color: colors.accentYellow },
      approved: { background: `${colors.accentGreen}20`, color: colors.accentGreen },
      rejected: { background: `${colors.accentRed}20`, color: colors.accentRed }
    };
    return (
      <span style={{ ...badgeStyle, ...styles[status] }}>
        {status === "pending" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        )}
        {status === "approved" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )}
        {status === "rejected" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        )}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerSection}>
        <div>
          <h1 style={pageTitle}>Grant Requests</h1>
          <p style={pageSubtitle}>Review and manage funding applications</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={filterTabs}>
        {["pending", "approved", "rejected", "all"].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              ...tabBtn,
              background: filter === tab ? colors.accentGreen : "transparent",
              color: filter === tab ? "#000" : colors.textSecondary,
              border: filter === tab ? "none" : `1px solid ${colors.border}`,
            }}
          >
            {tab === "pending" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            )}
            {tab === "approved" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {tab === "rejected" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
            {tab === "all" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            )}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <div style={emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <p style={emptyTitle}>No {filter === "all" ? "" : filter} grant requests</p>
          <p style={emptySubtitle}>
            {filter === "pending" ? "All caught up! No pending requests to review." : "Requests will appear here when submitted."}
          </p>
        </div>
      ) : (
        <div style={requestsList}>
          {requests.map(req => (
            <div key={req.id} style={requestCard}>
              <div style={requestHeader}>
                <div style={requestTitleRow}>
                  <h3 style={requestTitle}>{req.title}</h3>
                  {getStatusBadge(req.status)}
                </div>
                <p style={requestDescription}>{req.description}</p>
              </div>

              <div style={detailsGrid}>
                <div style={detailItem}>
                  <span style={detailLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Amount Requested
                  </span>
                  <span style={amountValue}>₹{Number(req.amount).toLocaleString()}</span>
                </div>
                <div style={detailItem}>
                  <span style={detailLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email
                  </span>
                  <span style={detailValue}>{req.email}</span>
                </div>
                <div style={detailItem}>
                  <span style={detailLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Phone
                  </span>
                  <span style={detailValue}>{req.phone || "—"}</span>
                </div>
              </div>

              <div style={requestMeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Submitted {new Date(req.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>

              {req.status === "pending" && (
                <div style={actionButtons}>
                  <button
                    onClick={() => handleApprove(req, false)}
                    disabled={processingId === req.id}
                    style={{ ...approveBtn, opacity: processingId === req.id ? 0.7 : 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {processingId === req.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleApprove(req, true)}
                    disabled={processingId === req.id}
                    style={{ ...approveProjectBtn, opacity: processingId === req.id ? 0.7 : 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {processingId === req.id ? "Processing..." : "Approve & Add to Projects"}
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                    style={rejectBtn}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
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
  background: `linear-gradient(135deg, ${colors.accentYellow}20, ${colors.accentGreen}20)`,
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

const filterTabs = {
  display: "flex",
  gap: spacing.sm,
  marginBottom: spacing.lg,
};

const tabBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "14px",
  transition: "all 0.2s",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 10px",
  borderRadius: borderRadius.full,
  fontSize: "12px",
  fontWeight: 600,
};

const requestsList = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
};

const requestCard = {
  ...themeCard,
};

const requestHeader = {
  marginBottom: spacing.md,
};

const requestTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.sm,
};

const requestTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
};

const requestDescription = {
  fontSize: "14px",
  color: colors.textSecondary,
  lineHeight: 1.6,
  margin: 0,
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: spacing.md,
  padding: spacing.md,
  background: colors.bgSecondary,
  borderRadius: borderRadius.md,
  marginBottom: spacing.md,
};

const detailItem = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.xs,
};

const detailLabel = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  fontSize: "12px",
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const detailValue = {
  fontSize: "14px",
  color: colors.textPrimary,
};

const amountValue = {
  fontSize: "20px",
  fontWeight: 700,
  color: colors.accentRed,
};

const requestMeta = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  fontSize: "13px",
  color: colors.textMuted,
};

const actionButtons = {
  display: "flex",
  gap: spacing.sm,
  marginTop: spacing.md,
  paddingTop: spacing.md,
  borderTop: `1px solid ${colors.border}`,
  flexWrap: "wrap",
};

const approveBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  background: colors.accentGreen,
  color: "#000",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const approveProjectBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  background: colors.accentBlue,
  color: "#000",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const rejectBtn = {
  display: "flex",
  alignItems: "center",
  gap: spacing.xs,
  background: "transparent",
  color: colors.accentRed,
  border: `1px solid ${colors.accentRed}`,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "14px",
};

const emptyState = {
  ...themeCard,
  textAlign: "center",
  padding: spacing.xxl,
};

const emptyTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textSecondary,
  marginTop: spacing.md,
};

const emptySubtitle = {
  fontSize: "14px",
  color: colors.textMuted,
  marginTop: spacing.xs,
};

export default GrantRequests;
