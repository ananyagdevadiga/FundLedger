import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard, inputStyle as themeInput, buttonPrimary, buttonSecondary } from "../../styles/theme";

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      addToast("Please enter announcement message", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from("announcements")
          .update({ message: message.trim() })
          .eq("id", editingAnnouncement.id);

        if (error) throw error;

        setEditingAnnouncement(null);
        setMessage("");
        addToast("Announcement updated successfully!", "success");
        fetchAnnouncements();
      } else {
        // Create new announcement
        const { error } = await supabase.from("announcements").insert([{
          message: message.trim(),
          created_by: user?.id
        }]);

        if (error) throw error;

        setMessage("");
        addToast("Announcement posted successfully!", "success");
        fetchAnnouncements();
      }
    } catch (err) {
      addToast(editingAnnouncement ? "Failed to update announcement" : "Failed to post announcement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, preview) => {
    setConfirmTargetId(id);
    setConfirmMsg(preview ? `Delete announcement "${preview}"?` : "Delete this announcement?");
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    const id = confirmTargetId;
    setConfirmOpen(false);

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      addToast("Announcement deleted", "success");
      fetchAnnouncements();
    } catch (err) {
      addToast("Failed to delete announcement", "error");
    } finally {
      setConfirmTargetId(null);
      setConfirmMsg("");
    }
  };

  const handleEdit = (ann) => {
    setEditingAnnouncement(ann);
    setMessage(ann.message || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setMessage("");
  }; 

  // Post fund update announcement
  const postFundUpdate = async () => {
    try {
      const { data: txnData } = await supabase
        .from("transactions")
        .select("amount, type");

      let balance = 0;
      (txnData || []).forEach(txn => {
        if (txn.type === "credit") balance += Number(txn.amount);
        if (txn.type === "debit") balance -= Number(txn.amount);
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const msg = `Fund Update: Our current total fund stands at ₹${balance.toLocaleString()}`;

      const { error } = await supabase.from("announcements").insert([{ 
        message: msg,
        created_by: user?.id
      }]);
      
      if (error) throw error;
      addToast("Fund update posted!", "success");
      fetchAnnouncements();
    } catch (err) {
      addToast("Failed to post fund update", "error");
    }
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerSection}>
        <div>
          <h1 style={pageTitle}>Announcements</h1>
          <p style={pageSubtitle}>Communicate with your users</p>
        </div>
      </div>

      {/* Post Form */}
      <div style={{ ...themeCard, marginBottom: spacing.lg }}>
        <h3 style={formTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {editingAnnouncement ? "Edit Announcement" : "Post New Announcement"}
        </h3>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Write your announcement message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <div style={formActions}>
            {editingAnnouncement && (
              <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                Cancel
              </button>
            )}

            <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              {submitting ? (editingAnnouncement ? "Saving..." : "Posting...") : (editingAnnouncement ? "Save Changes" : "Post Announcement")}
            </button>

            <button type="button" onClick={postFundUpdate} style={fundUpdateBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor"/>
                <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor"/>
                <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor"/>
              </svg>
              Post Fund Update
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <h3 style={sectionTitle}>All Announcements</h3>

        {loading ? (
          <Spinner />
        ) : announcements.length === 0 ? (
          <div style={emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={emptyTitle}>No announcements yet</p>
            <p style={emptySubtitle}>Post your first announcement above</p>
          </div>
        ) : (
          <div style={announcementsList}>
            {announcements.map((ann, index) => (
              <div key={ann.id} style={announcementCard}>
                <div style={announcementContent}>
                  <div style={announcementHeader}>
                    <div style={bulletDot} />
                    <span style={dateLabel}>
                      {new Date(ann.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {index === 0 && <span style={newBadge}>Latest</span>}
                  </div>
                  <p style={messageText}>{ann.message}</p>
                </div>
                <div style={actionBtns}>
                  <button onClick={() => handleEdit(ann)} style={iconBtn} title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <button onClick={() => handleDelete(ann.id, ann.message)} style={{ ...iconBtn, color: colors.accentRed }} title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmOpen && (
        <div style={confirmOverlay} onClick={() => setConfirmOpen(false)}>
          <div style={confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={confirmTitle}>Confirm Delete</h3>
            <p style={confirmMsgStyle}>{confirmMsg}</p>
            <div style={confirmActions}>
              <button style={confirmCancelBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button style={confirmPrimaryBtn} onClick={performDelete}>Delete</button>
            </div>
          </div>
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
  background: `linear-gradient(135deg, ${colors.accentBlue}20, ${colors.accentPurple}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentBlue,
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

const formTitle = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.md,
};

const inputStyle = {
  ...themeInput,
  width: "100%",
  boxSizing: "border-box",
};

const formActions = {
  display: "flex",
  gap: spacing.md,
  marginTop: spacing.md,
};

const primaryBtn = {
  ...buttonPrimary,
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
};

const fundUpdateBtn = {
  ...buttonSecondary,
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  color: colors.accentBlue,
  borderColor: colors.accentBlue,
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.md,
};

const announcementsList = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
};

const announcementCard = {
  ...themeCard,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
};

const announcementContent = {
  flex: 1,
};

const announcementHeader = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
};

const bulletDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: colors.accentBlue,
};

const dateLabel = {
  color: colors.textMuted,
  fontSize: "13px",
};

const newBadge = {
  background: `${colors.accentGreen}20`,
  color: colors.accentGreen,
  padding: "2px 8px",
  borderRadius: borderRadius.full,
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const messageText = {
  color: colors.textPrimary,
  fontSize: "15px",
  lineHeight: 1.6,
  margin: 0,
};

const deleteBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: spacing.sm,
  borderRadius: borderRadius.sm,
  color: colors.textMuted,
  transition: "color 0.2s",
  display: "flex",
};

const actionBtns = {
  display: "flex",
  gap: spacing.xs,
  alignItems: "center",
};

const iconBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: spacing.sm,
  borderRadius: borderRadius.sm,
  color: colors.textMuted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryBtn = {
  ...buttonSecondary,
};

/* Confirmation modal styles */
const confirmOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
};

const confirmBox = {
  ...themeCard,
  maxWidth: 520,
  width: "100%",
  padding: spacing.lg,
  textAlign: "left",
};

const confirmTitle = {
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
  marginBottom: spacing.sm,
};

const confirmMsgStyle = {
  fontSize: "14px",
  color: colors.textSecondary,
  marginBottom: spacing.md,
};

const confirmActions = {
  display: "flex",
  gap: spacing.sm,
  justifyContent: "flex-end",
};

const confirmPrimaryBtn = {
  background: colors.accentRed,
  color: "#fff",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
};

const confirmCancelBtn = {
  background: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
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

export default AdminAnnouncements;
