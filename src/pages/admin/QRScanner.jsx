import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../supabase";
import QRCode from "qrcode";

function AdminQRScanner() {
  const [txn, setTxn] = useState(null);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

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

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("txn_id", decodedText)
        .single();

      if (fetchError || !data) {
        setError("Invalid or unknown transaction QR");
        return;
      }

      // Generate QR for display
      const qrUrl = await QRCode.toDataURL(data.txn_id);
      setQrDataUrl(qrUrl);
      setTxn(data);
    } catch (err) {
      console.error(err);
      setError("Failed to read QR data");
    }
  };

  const onScanError = () => {
    // silently ignore scan errors
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Scan Transaction QR</h1>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
        {/* Scanner */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16 }}>QR Scanner</h3>
          <div id="admin-qr-reader" />
        </div>

        {/* Result */}
        <div style={{ ...cardStyle, minWidth: 350, flex: 1 }}>
          <h3 style={{ marginBottom: 16 }}>Transaction Details</h3>

          {error && <p style={{ color: "#f87171" }}>{error}</p>}

          {!txn && !error && (
            <p style={muted}>Scan a transaction QR code to view its details</p>
          )}

          {txn && (
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={detailRow}>
                  <span style={muted}>Transaction ID</span>
                  <span style={{ fontFamily: "monospace" }}>{txn.txn_id}</span>
                </div>

                <div style={detailRow}>
                  <span style={muted}>Title</span>
                  <span>{txn.title || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={muted}>Description</span>
                  <span>{txn.description || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={muted}>Amount</span>
                  <span style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: txn.type === "credit" ? "#34d399" : "#f87171"
                  }}>
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={muted}>Type</span>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: txn.type === "credit" ? "#34d399" : "#f87171",
                    color: "#000"
                  }}>
                    {txn.type === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={muted}>Date</span>
                  <span>{new Date(txn.created_at).toLocaleString()}</span>
                </div>
              </div>

              {qrDataUrl && (
                <div style={{ textAlign: "center" }}>
                  <img src={qrDataUrl} alt="QR Code" style={{ borderRadius: 8 }} />
                  <p style={{ ...muted, marginTop: 8 }}>Transaction QR</p>
                </div>
              )}
            </div>
          )}
        </div>
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

const detailRow = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginBottom: 16
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default AdminQRScanner;
