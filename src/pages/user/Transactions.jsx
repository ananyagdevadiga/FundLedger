import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";
import { colors, borderRadius } from "../../styles/theme";
import QRCode from "qrcode";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, txnData: null, qrImage: "" });

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);

        const { data, error } = await supabase
          .from("transactions")
          .select("id, txn_id, title, description, amount, type, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setTransactions(data || []);
        }
      } catch (err) {
        // Ignore AbortError but still set loading to false
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          // Don't log or show error for AbortError
        } else if (isMounted) {
          setError("Failed to load transactions");
        }
      } finally {
        // Ensure minimum 3 seconds loading time
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, remaining);
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewQR = async (txn) => {
    try {
      // Create QR data with full transaction details
      const qrData = JSON.stringify({
        txn_id: txn.txn_id,
        title: txn.title,
        description: txn.description || "",
        amount: txn.amount,
        type: txn.type,
        date: txn.created_at
      });
      
      const qrImage = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: "#000", light: "#fff" }
      });
      setQrModal({ open: true, txnData: txn, qrImage });
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  const closeModal = () => {
    setQrModal({ open: false, txnData: null, qrImage: "" });
  };

  return (
    <UserLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 8px" }}>
        <h1 style={{ textAlign: "left", fontSize: 34, fontWeight: 800, margin: "32px 0 8px 0", letterSpacing: -1, color: colors.textPrimary }}>Transactions</h1>

        {/* Summary Box */}
        <div style={{
          width: "100%",
          background: colors.bgCard,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          padding: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 64,
          boxSizing: "border-box",
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
          marginBottom: 24
        }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: colors.textMuted, fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Account balance</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: colors.textPrimary, letterSpacing: -1 }}>
              ₹{(transactions.reduce((acc, t) => t.type === "credit" ? acc + t.amount : acc - t.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: colors.textMuted, fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Total revenue</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
              ₹{(transactions.filter(t => t.type === "credit").reduce((acc, t) => acc + t.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: colors.textMuted, fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Total expenses</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
              ₹{(transactions.filter(t => t.type === "debit").reduce((acc, t) => acc + t.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, margin: "0 0 24px 0" }} />

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner />
          </div>
        )}
        {error && <p style={{ color: colors.accentRed }}>{error}</p>}

        {!loading && !error && (
          <div style={{
            ...cardStyle,
            boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)",
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            padding: 0,
            overflowX: "auto",
            marginBottom: 40
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  <th style={{ ...th, padding: "16px 12px", fontSize: 15, fontWeight: 700, textAlign: "left" }}>Date</th>
                  <th style={{ ...th, padding: "16px 12px", fontSize: 15, fontWeight: 700, textAlign: "left" }}>Description</th>
                  <th style={{ ...th, padding: "16px 12px", fontSize: 15, fontWeight: 700, textAlign: "left" }}>QR Code</th>
                  <th style={{ ...th, padding: "16px 12px", fontSize: 15, fontWeight: 700, textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id} style={{ ...rowStyle, transition: "background 0.2s", cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.background = colors.bgSecondary}
                    onMouseOut={e => e.currentTarget.style.background = ""}>
                    <td style={{ ...tdMuted, padding: "14px 12px" }}>
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ ...td, padding: "14px 12px" }}>
                      {txn.title || "—"}
                    </td>
                    <td style={{ ...td, padding: "14px 12px" }}>
                      <button
                        onClick={() => handleViewQR(txn)}
                        title="View QR Code"
                        style={{
                          background: colors.bgSecondary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: borderRadius.sm,
                          padding: 8,
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
                    <td
                      style={{
                        ...td,
                        padding: "14px 12px",
                        textAlign: "right",
                        color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                        fontWeight: 600
                      }}
                    >
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: 40, color: colors.textMuted, textAlign: "center" }}>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* QR Modal */}
        {qrModal.open && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={closeModal}
          >
            <div 
              style={{
                background: colors.bgCard,
                borderRadius: borderRadius.lg,
                padding: 16,
                border: `1px solid ${colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={qrModal.qrImage} alt="QR Code" style={{ borderRadius: 8, display: "block" }} />
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

/* ---------- styles ---------- */

const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: "8px 20px"
};

const theadStyle = {
  color: colors.textMuted,
  textAlign: "left",
  borderBottom: `1px solid ${colors.border}`
};

const th = {
  padding: "16px 0",
  fontWeight: 500,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const rowStyle = {
  borderBottom: `1px solid ${colors.border}`,
  transition: "background 0.2s",
};

const td = {
  padding: "16px 0",
  fontSize: 14,
};

const tdMuted = {
  ...td,
  color: colors.textMuted,
};

export default Transactions;
