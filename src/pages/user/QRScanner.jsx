import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../supabase";

function QRScanner() {
  const [txn, setTxn] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
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

      const { data, error } = await supabase
        .from("transactions")
        .select("txn_id, title, description, amount, type, created_at")
        .eq("txn_id", decodedText)
        .single();

      if (error || !data) {
        setError("Invalid or unknown transaction QR");
        return;
      }

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
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Scan QR</h1>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
        {/* Scanner */}
        <div style={cardStyle}>
          <div id="qr-reader" />
        </div>

        {/* Result */}
        <div style={{ ...cardStyle, minWidth: 300 }}>
          <h3>Transaction Details</h3>

          {error && <p style={{ color: "#f87171" }}>{error}</p>}

          {!txn && !error && (
            <p style={muted}>Scan a transaction QR to view details</p>
          )}

          {txn && (
            <>
              <p><strong>Txn ID:</strong> {txn.txn_id}</p>
              <p><strong>Title:</strong> {txn.title || "—"}</p>
              <p><strong>Description:</strong> {txn.description || "—"}</p>
              <p>
                <strong>Amount:</strong>{" "}
                <span style={{ color: txn.type === "credit" ? "#34d399" : "#f87171" }}>
                  {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                </span>
              </p>
              <p style={muted}>
                {new Date(txn.created_at).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

/* ---------- styles ---------- */

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "16px"
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default QRScanner;
