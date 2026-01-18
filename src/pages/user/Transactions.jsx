import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);

        const { data, error } = await supabase
          .from("transactions")
          .select("id, txn_id, title, amount, type, created_at")
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

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Transactions</h1>

      {loading && <Spinner />}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={theadStyle}>
                <th style={th}>Date</th>
                <th style={th}>Description</th>
                <th style={th}>Txn ID</th>
                <th style={{ ...th, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} style={rowStyle}>
                  <td style={tdMuted}>
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>

                  <td style={td}>
                    {txn.title || "—"}
                  </td>

                  <td style={tdMuted}>
                    {txn.txn_id}
                  </td>

                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                      color: txn.type === "credit" ? "#34d399" : "#f87171",
                      fontWeight: 500
                    }}
                  >
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: 20, color: "#9ca3af" }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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

const theadStyle = {
  color: "#9ca3af",
  textAlign: "left",
  borderBottom: "1px solid #1f2933"
};

const th = {
  paddingBottom: 10,
  fontWeight: 500
};

const rowStyle = {
  borderBottom: "1px solid #1f2933"
};

const td = {
  padding: "12px 0"
};

const tdMuted = {
  ...td,
  color: "#9ca3af",
  fontSize: 14
};

export default Transactions;
