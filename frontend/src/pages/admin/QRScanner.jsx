import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../supabase";
import QRCode from "qrcode";
import { colors, spacing, borderRadius, cardStyle as themeCard } from "../../styles/theme";

function AdminQRScanner() {
  const [txn, setTxn] = useState(null);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "admin-qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    try {
      setError(null);
      setTxn(null);
      setQrDataUrl("");
      setScanning(false);

      // Try to parse as JSON (new format with full transaction details)
      let txnData;
      try {
        txnData = JSON.parse(decodedText);
      } catch {
        // If not JSON, treat as legacy txn_id format
        txnData = null;
      }

      const txnId = txnData?.txn_id || decodedText;

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("txn_id", txnId)
        .single();

      if (fetchError || !data) {
        setError("Invalid or unknown transaction QR");
        return;
      }

      // Generate QR for display (JSON payload parity)
      const payload = JSON.stringify({
        txn_id: data.txn_id,
        title: data.title,
        description: data.description || "",
        amount: data.amount,
        type: data.type,
        date: data.created_at,
      });
      const qrUrl = await QRCode.toDataURL(payload, { width: 200, margin: 2, color: { dark: "#000", light: "#fff" } });
      setQrDataUrl(qrUrl);
      setTxn(data);
    } catch (err) {
      setError("Failed to read QR data");
    }
  };

  const onScanError = () => {
    // silently ignore scan errors
  };

  return (
    <AdminLayout>
      {/* Header (icon removed) */}
      <div style={headerSection}>
        <div>
          <h1 style={pageTitle}>Scan Transaction QR</h1>
          <p style={pageSubtitle}>Verify and view transaction details</p>
        </div>
      </div>

      <div style={contentGrid}>
        {/* Scanner Card */}
        <div style={scannerCard}>
          <div style={scannerHeader}>
            <div style={pulsingDot} />
            <span style={scannerStatus}>
              {scanning ? "Scanner Active" : "Scan Complete"}
            </span>
          </div>
          <div id="admin-qr-reader" style={scannerArea} />
          <p style={scannerHint}>Position QR code within the frame</p>
        </div>

        {/* Result Card */}
        <div style={resultCard}>
          <h3 style={resultTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Transaction Details
          </h3>

          {error && (
            <div style={errorBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {!txn && !error && (
            <div style={placeholderBox}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <p style={placeholderText}>Scan a transaction QR code to view its details</p>
            </div>
          )}

          {txn && (
            <div style={detailsLayout}>
              <div style={detailsContainer}>
                <div style={detailRow}>
                  <span style={detailLabel}>Transaction ID</span>
                  <span style={txnIdStyle}>{txn.txn_id}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Title</span>
                  <span style={detailValue}>{txn.title || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Description</span>
                  <span style={detailValue}>{txn.description || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Amount</span>
                  <span style={{
                    ...amountStyle,
                    color: txn.type === "credit" ? colors.accentGreen : colors.accentRed
                  }}>
                    {txn.type === "credit" ? "+" : "-"}₹{Number(txn.amount).toLocaleString()}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Type</span>
                  <span style={{
                    ...typeBadge,
                    background: txn.type === "credit" ? `${colors.accentGreen}20` : `${colors.accentRed}20`,
                    color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                  }}>
                    {txn.type === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Date</span>
                  <span style={detailMuted}>
                    {new Date(txn.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {txn && (
            <div style={verifiedBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Transaction Verified
            </div>
          )}
        </div>
      </div>
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
  background: `linear-gradient(135deg, ${colors.accentPurple}20, ${colors.accentBlue}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentPurple,
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

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: spacing.lg,
};

const scannerCard = {
  ...themeCard,
};

const scannerHeader = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.md,
};

const pulsingDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: colors.accentGreen,
  animation: "pulse 2s ease-in-out infinite",
};

const scannerStatus = {
  fontSize: "13px",
  color: colors.textSecondary,
  fontWeight: 500,
};

const scannerArea = {
  borderRadius: borderRadius.md,
  overflow: "hidden",
};

const scannerHint = {
  fontSize: "13px",
  color: colors.textMuted,
  textAlign: "center",
  marginTop: spacing.md,
  marginBottom: 0,
};

const resultCard = {
  ...themeCard,
};

const resultTitle = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.lg,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.border}`,
};

const errorBox = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  background: `${colors.accentRed}15`,
  border: `1px solid ${colors.accentRed}30`,
  borderRadius: borderRadius.md,
  color: colors.accentRed,
  fontSize: "14px",
};

const placeholderBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xxl,
  color: colors.textMuted,
};

const placeholderText = {
  marginTop: spacing.md,
  fontSize: "14px",
  textAlign: "center",
};

const detailsLayout = {
  display: "block",
};

const detailsContainer = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
};

const detailLabel = {
  fontSize: "13px",
  color: colors.textMuted,
};

const detailValue = {
  fontSize: "14px",
  color: colors.textPrimary,
  textAlign: "right",
  maxWidth: "60%",
  wordBreak: "break-word",
};

const detailMuted = {
  fontSize: "14px",
  color: colors.textSecondary,
};

const txnIdStyle = {
  fontFamily: "monospace",
  fontSize: "13px",
  background: colors.bgSecondary,
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  color: colors.textSecondary,
};

const amountStyle = {
  fontSize: "18px",
  fontWeight: 700,
};

const typeBadge = {
  padding: "4px 10px",
  borderRadius: borderRadius.full,
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "inline-block",
};

const qrImage = {
  borderRadius: borderRadius.md,
};

const verifiedBadge = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  marginTop: spacing.lg,
  padding: spacing.md,
  background: `${colors.accentGreen}10`,
  border: `1px solid ${colors.accentGreen}30`,
  borderRadius: borderRadius.md,
  color: colors.accentGreen,
  fontSize: "14px",
  fontWeight: 500,
};

export default AdminQRScanner;
