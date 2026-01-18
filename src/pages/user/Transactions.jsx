import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select("id, txn_id, title, amount, type, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Transactions</h1>

      {loading && <p>Loading transactions…</p>}
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
