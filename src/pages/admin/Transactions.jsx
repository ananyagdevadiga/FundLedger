import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { generateTxnId } from "../../utils/txn";
import QRCode from "qrcode";

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [editingTxn, setEditingTxn] = useState(null);

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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount) {
      alert("Please fill required fields");
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

      // Generate QR for the new transaction
      const qrUrl = await QRCode.toDataURL(txnId);
      setQrDataUrl(qrUrl);
      setShowQR(txnId);

      setForm({ title: "", description: "", amount: "", type: "credit" });
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowQR = async (txnId) => {
    const qrUrl = await QRCode.toDataURL(txnId);
    setQrDataUrl(qrUrl);
    setShowQR(txnId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete: " + err.message);
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
      alert("Please fill required fields");
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
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update transaction");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28 }}>Transactions</h1>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={modalOverlay} onClick={() => setShowQR(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Transaction QR Code</h3>
            <p style={muted}>Txn ID: {showQR}</p>
            <img src={qrDataUrl} alt="QR Code" style={{ marginTop: 16, borderRadius: 8 }} />
            <button onClick={() => setShowQR(null)} style={{ ...secondaryBtn, marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && !editingTxn && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16 }}>New Transaction</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <input
                name="title"
                placeholder="Title *"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
              />
              <input
                name="amount"
                type="number"
                placeholder="Amount (₹) *"
                value={form.amount}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <textarea
              name="description"
              placeholder="Description (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle, resize: "none", marginTop: 16 }}
            />

            <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="type"
                  value="credit"
                  checked={form.type === "credit"}
                  onChange={handleChange}
                />
                <span style={{ color: "#34d399" }}>Credit (Add Funds)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="type"
                  value="debit"
                  checked={form.type === "debit"}
                  onChange={handleChange}
                />
                <span style={{ color: "#f87171" }}>Debit (Deduct Funds)</span>
              </label>

              <button type="submit" disabled={submitting} style={{ ...primaryBtn, marginLeft: "auto" }}>
                {submitting ? "Creating..." : "Create Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingTxn && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16 }}>Edit Transaction</h3>
          <p style={{ ...muted, marginBottom: 16 }}>Txn ID: {editingTxn.txn_id}</p>
          <form onSubmit={handleUpdate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <input
                name="title"
                placeholder="Title *"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
              />
              <input
                name="amount"
                type="number"
                placeholder="Amount (₹) *"
                value={form.amount}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <textarea
              name="description"
              placeholder="Description (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle, resize: "none", marginTop: 16 }}
            />

            <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="type"
                  value="credit"
                  checked={form.type === "credit"}
                  onChange={handleChange}
                />
                <span style={{ color: "#34d399" }}>Credit (Add Funds)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="type"
                  value="debit"
                  checked={form.type === "debit"}
                  onChange={handleChange}
                />
                <span style={{ color: "#f87171" }}>Debit (Deduct Funds)</span>
              </label>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={primaryBtn}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        {loading ? (
          <p style={muted}>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p style={muted}>No transactions yet. Add your first transaction above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={theadStyle}>
                <th style={th}>Date</th>
                <th style={th}>Title</th>
                <th style={th}>Txn ID</th>
                <th style={{ ...th, textAlign: "right" }}>Amount</th>
                <th style={{ ...th, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} style={rowStyle}>
                  <td style={tdMuted}>
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>
                  <td style={td}>
                    <div>{txn.title || "—"}</div>
                    {txn.description && <div style={{ ...muted, fontSize: 12 }}>{txn.description}</div>}
                  </td>
                  <td style={tdMuted}>{txn.txn_id}</td>
                  <td style={{
                    ...td,
                    textAlign: "right",
                    color: txn.type === "credit" ? "#34d399" : "#f87171",
                    fontWeight: 500
                  }}>
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <button onClick={() => handleShowQR(txn.txn_id)} style={iconBtn} title="View QR">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                      </svg>
                    </button>
                    <button onClick={() => handleEdit(txn)} style={{ ...iconBtn, marginLeft: 8 }} title="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(txn.id)} style={{ ...iconBtn, marginLeft: 8 }} title="Delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
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

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "20px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #1f2933",
  background: "#0b0e14",
  color: "white",
  fontSize: 14
};

const primaryBtn = {
  background: "#4ade80",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const secondaryBtn = {
  background: "#1f2933",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer"
};

const iconBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "4px",
  color: "#9ca3af",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "color 0.2s"
};

const theadStyle = {
  color: "#9ca3af",
  textAlign: "left",
  borderBottom: "1px solid #1f2933"
};

const th = { paddingBottom: 10, fontWeight: 500 };
const rowStyle = { borderBottom: "1px solid #1f2933" };
const td = { padding: "12px 0" };
const tdMuted = { ...td, color: "#9ca3af", fontSize: 14 };
const muted = { color: "#9ca3af", fontSize: 14 };

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalContent = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center",
  maxWidth: 320
};

export default AdminTransactions;
