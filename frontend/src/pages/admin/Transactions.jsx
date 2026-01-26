import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { generateTxnId } from "../../utils/txn";
import QRCode from "qrcode";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard, inputStyle as themeInput, buttonPrimary, buttonSecondary, tableStyles } from "../../styles/theme";

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [editingTxn, setEditingTxn] = useState(null);

  // Delete confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState("");

  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    type: "credit"
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount) {
      addToast("Please fill required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const txnId = generateTxnId();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("transactions").insert([{
        txn_id: txnId,
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        created_by: user?.id
      }]);

      if (error) throw error;

      // Do not auto-open QR modal after creation; user can click "View QR" from the list
      setForm({ title: "", description: "", amount: "", type: "credit" });
      setShowForm(false);
      addToast("Transaction created successfully!", "success");
      fetchTransactions();
    } catch (err) {
      addToast("Failed to create transaction", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowQR = async (txn) => {
    const payload = JSON.stringify({
      txn_id: txn.txn_id,
      title: txn.title,
      description: txn.description || "",
      amount: txn.amount,
      type: txn.type,
      date: txn.created_at,
    });
    const qrUrl = await QRCode.toDataURL(payload, { width: 200, margin: 2, color: { dark: "#000", light: "#fff" } });
    setQrDataUrl(qrUrl);
    setShowQR(txn.txn_id);
  };

  // Open confirmation modal for transaction delete
  const handleDelete = (id, title) => {
    setConfirmTargetId(id);
    setConfirmMsg(title ? `Delete transaction "${title}"?` : "Delete this transaction?");
    setConfirmOpen(true);
  };

  // Perform deletion after confirmation
  const performDelete = async () => {
    const id = confirmTargetId;
    setConfirmOpen(false);

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      addToast("Transaction deleted", "success");
      fetchTransactions();
    } catch (err) {
      addToast("Failed to delete transaction", "error");
    } finally {
      setConfirmTargetId(null);
      setConfirmMsg("");
    }
  }; 

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    setForm({
      title: txn.title || "",
      description: txn.description || "",
      amount: txn.amount.toString(),
      type: txn.type
    });
    setShowForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount) {
      addToast("Please fill required fields", "error");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("transactions")
        .update({
          title: form.title,
          description: form.description,
          amount: Number(form.amount),
          type: form.type
        })
        .eq("id", editingTxn.id);

      if (error) throw error;

      setForm({ title: "", description: "", amount: "", type: "credit" });
      setEditingTxn(null);
      addToast("Transaction updated successfully!", "success");
      fetchTransactions();
    } catch (err) {
      addToast("Failed to update transaction", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingTxn(null);
    setForm({ title: "", description: "", amount: "", type: "credit" });
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerContainer}>
        <div style={headerSection}>
          <div>
            <h1 style={pageTitle}>Transactions</h1>
            <p style={pageSubtitle}>Manage all financial transactions</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingTxn(null); }} style={primaryBtn}>
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={modalOverlay} onClick={() => setShowQR(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <button onClick={(e) => { e.stopPropagation(); setShowQR(null); }} aria-label="Close QR modal" style={closeBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <img src={qrDataUrl} alt="QR Code" style={qrImage} />
            <p style={qrHint}>Scan to verify transaction</p>
          </div>
        </div>
      )}

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

      {/* Add Form */} 
      {showForm && !editingTxn && (
        <div style={{ ...themeCard, marginBottom: spacing.lg }}>
          <h3 style={formTitle}>New Transaction</h3>
          <form onSubmit={handleSubmit}>
            <div style={formGrid}>
              <div style={formGroup}>
                <label style={labelStyle}>Title <span style={requiredStar}>*</span></label>
                <input
                  name="title"
                  placeholder="Transaction title"
                  value={form.title}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Amount (₹) <span style={requiredStar}>*</span></label>
                <input
                  name="amount"
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                placeholder="Optional description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={formActions}>
              <div style={radioGroup}>
                <label style={radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    value="credit"
                    checked={form.type === "credit"}
                    onChange={handleChange}
                    style={radioInput}
                  />
                  <span style={{ ...radioText, color: colors.accentGreen }}>Credit (Add Funds)</span>
                </label>

                <label style={radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    value="debit"
                    checked={form.type === "debit"}
                    onChange={handleChange}
                    style={radioInput}
                  />
                  <span style={{ ...radioText, color: colors.accentRed }}>Debit (Deduct Funds)</span>
                </label>
              </div>

              <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Creating..." : "Create Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingTxn && (
        <div style={{ ...themeCard, marginBottom: spacing.lg }}>
          <h3 style={formTitle}>Edit Transaction</h3>
          <p style={txnIdLabel}>Txn ID: <span style={txnIdCode}>{editingTxn.txn_id}</span></p>
          <form onSubmit={handleUpdate}>
            <div style={formGrid}>
              <div style={formGroup}>
                <label style={labelStyle}>Title <span style={requiredStar}>*</span></label>
                <input
                  name="title"
                  placeholder="Transaction title"
                  value={form.title}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Amount (₹) <span style={requiredStar}>*</span></label>
                <input
                  name="amount"
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                placeholder="Optional description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={formActions}>
              <div style={radioGroup}>
                <label style={radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    value="credit"
                    checked={form.type === "credit"}
                    onChange={handleChange}
                    style={radioInput}
                  />
                  <span style={{ ...radioText, color: colors.accentGreen }}>Credit (Add Funds)</span>
                </label>

                <label style={radioLabel}>
                  <input
                    type="radio"
                    name="type"
                    value="debit"
                    checked={form.type === "debit"}
                    onChange={handleChange}
                    style={radioInput}
                  />
                  <span style={{ ...radioText, color: colors.accentRed }}>Debit (Deduct Funds)</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: spacing.sm }}>
                <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <div style={themeCard}>
        {loading ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <div style={emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p style={emptyTitle}>No transactions yet</p>
            <p style={emptySubtitle}>Add your first transaction above</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={tableStyles.header}>Date</th>
                <th style={tableStyles.header}>Title</th>
                <th style={{ ...tableStyles.header, textAlign: "right" }}>Amount</th>
                <th style={{ ...tableStyles.header, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} style={tableStyles.row}>
                  <td style={tableStyles.cellMuted}>
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>
                  <td style={tableStyles.cell}>
                    <div>{txn.title || "—"}</div>
                    {txn.description && <div style={descriptionText}>{txn.description}</div>}
                  </td>

                  <td style={{
                    ...tableStyles.cell,
                    textAlign: "right",
                    color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                    fontWeight: 600
                  }}>
                    {txn.type === "credit" ? "+" : "-"}₹{Number(txn.amount).toLocaleString()}
                  </td>
                  <td style={{ ...tableStyles.cell, textAlign: "center" }}>
                    <div style={actionBtns}>
                      <button onClick={() => handleShowQR(txn)} style={iconBtn} title="View QR">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                      </button>
                      <button onClick={() => handleEdit(txn)} style={iconBtn} title="Edit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(txn.id, txn.title)} style={{ ...iconBtn, color: colors.accentRed }} title="Delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

/* ---------- styles ---------- */

const headerContainer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
};

const headerSection = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
};

const headerIcon = {
  width: "48px",
  height: "48px",
  borderRadius: borderRadius.md,
  background: `linear-gradient(135deg, ${colors.accentGreen}20, ${colors.accentBlue}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentGreen,
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

const primaryBtn = {
  ...buttonPrimary,
};

const secondaryBtn = {
  ...buttonSecondary,
};

const formTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.lg,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: spacing.md,
};

const formGroup = {
  marginBottom: spacing.md,
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const requiredStar = {
  color: colors.accentRed,
};

const inputStyle = {
  ...themeInput,
  width: "100%",
  boxSizing: "border-box",
};

const formActions = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
};

const radioGroup = {
  display: "flex",
  gap: spacing.lg,
};

const radioLabel = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  cursor: "pointer",
};

const radioInput = {
  accentColor: colors.accentGreen,
};

const radioText = {
  fontSize: "14px",
  fontWeight: 500,
};

const txnIdLabel = {
  color: colors.textMuted,
  fontSize: "14px",
  marginBottom: spacing.md,
};

const txnIdCode = {
  fontFamily: "monospace",
  fontSize: "13px",
  background: colors.bgSecondary,
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  color: colors.textSecondary,
};

const descriptionText = {
  color: colors.textMuted,
  fontSize: "12px",
  marginTop: "4px",
};

const actionBtns = {
  display: "flex",
  gap: spacing.xs,
  justifyContent: "center",
};

const iconBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "8px",
  borderRadius: borderRadius.sm,
  color: colors.textMuted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "color 0.2s, background 0.2s",
};

const emptyState = {
  textAlign: "center",
  padding: spacing.xxl,
  color: colors.textMuted,
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

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

const modalContent = {
  ...themeCard,
  textAlign: "center",
  maxWidth: 380,
  position: "relative",
  padding: spacing.lg,
  paddingTop: spacing.xl,
};

const modalHeader = {
  // header kept for layout / accessibility but no content expected
  height: 0,
};

const modalTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
};

const closeBtn = {
  position: 'absolute',
  left: spacing.sm,
  top: spacing.sm,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: colors.textMuted,
  padding: "4px",
  display: "flex",
};

const txnIdDisplay = {
  fontFamily: "monospace",
  fontSize: "14px",
  color: colors.textSecondary,
  background: colors.bgSecondary,
  padding: "8px 12px",
  borderRadius: borderRadius.sm,
  marginBottom: spacing.md,
};

const qrImage = {
  width: 200,
  height: 200,
  padding: 4,
  background: '#fff',
  borderRadius: borderRadius.md,
  display: 'inline-block',
  marginBottom: spacing.md,
  boxShadow: '0 10px 30px rgba(0,0,0,0.18)'
};

const qrHint = {
  fontSize: "13px",
  color: colors.textMuted,
  margin: 0,
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

export default AdminTransactions;
