import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";

function Home() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalFund, setTotalFund] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // Fetch announcements
        const { data: annData, error: annError } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (annError) throw annError;

        // Fetch recent transactions (limit to avoid slow loading)
        const { data: txnData, error: txnError } = await supabase
          .from("transactions")
          .select("id, txn_id, title, amount, type, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (txnError) throw txnError;

        // Fetch total fund (sum from all transactions)
        const { data: allTxns, error: allTxnError } = await supabase
          .from("transactions")
          .select("amount, type");

        if (allTxnError) throw allTxnError;

        // Calculate total fund
        let balance = 0;
        (allTxns || []).forEach(txn => {
          if (txn.type === "credit") balance += Number(txn.amount);
          if (txn.type === "debit") balance -= Number(txn.amount);
        });

        if (isMounted) {
          setAnnouncements(annData || []);
          setTransactions(txnData || []);
          setTotalFund(balance);
        }
      } catch (err) {
        // Ignore AbortError but still set loading to false
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          // Don't log or show error for AbortError
        } else if (isMounted) {
          setError("Failed to load home data");
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

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Home</h1>

      {loading && <Spinner />}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Announcement banner */}
          {announcements.length > 0 && (
            <div style={{...bannerStyle, display: "flex", alignItems: "center", gap: "10px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 7L4 3V17L20 13V7Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
                <path d="M4 10L2 10L2 12C2 13.1 2.9 14 4 14V10Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
                <path d="M5 17L4 21L7 20L5 17Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              {announcements[0].message}
            </div>
          )}

          {/* Top cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Total Fund */}
            <div style={cardStyle}>
              <p style={muted}>Total Fund</p>
              <h2 style={{ fontSize: 36, color: "#4ade80" }}>
                ₹{totalFund.toLocaleString()}
              </h2>
            </div>

            {/* Recent Transactions */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <h3>Recent Transactions</h3>
              </div>

              {transactions.slice(0, 6).map(txn => (
                <div
                  key={txn.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    color: txn.type === "credit" ? "#34d399" : "#f87171"
                  }}
                >
                  <span>{txn.title || txn.txn_id}</span>
                  <span>
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </span>
                </div>
              ))}

              {transactions.length === 0 && (
                <p style={muted}>No transactions yet</p>
              )}
            </div>
          </div>

          {/* Announcements list */}
          <div style={{ marginTop: 30 }}>
            <h3 style={{ marginBottom: 10 }}>Announcements</h3>

            <div style={cardStyle}>
              {announcements.length === 0 && (
                <p style={muted}>No announcements</p>
              )}

              {announcements.map(ann => (
                <div key={ann.id} style={{ marginBottom: 10 }}>
                  <p>{ann.message}</p>
                  <small style={muted}>
                    {new Date(ann.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </UserLayout>
  );
}

/* ---------- styles ---------- */

const cardStyle = {
  background: "#111827",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #1f2933"
};

const bannerStyle = {
  background: "#0f172a",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: 20
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default Home;
