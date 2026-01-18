import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { generateTxnId } from "../../utils/txn";
import { Spinner } from "../../components/Spinner";

function GrantRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);

      let query = supabase
        .from("grant_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
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

  const handleApprove = async (request, addToProjects = false) => {
    const confirmMsg = addToProjects 
      ? `Approve grant of ₹${request.amount} for "${request.title}" and add to Projects?`
      : `Approve grant of ₹${request.amount} for "${request.title}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(request.id);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create debit transaction
      const txnId = generateTxnId();
      const { error: txnError } = await supabase.from("transactions").insert([{
        txn_id: txnId,
        title: `Grant: ${request.title}`,
        description: `Approved grant request from ${request.email}. ${request.description || ""}`,
        amount: Number(request.amount),
        type: "debit",
        created_by: user?.id
      }]);

      if (txnError) throw txnError;

      // If addToProjects is true, create project entry
      if (addToProjects) {
        const { error: projectError } = await supabase.from("projects").insert([{
          title: request.title,
          description: request.description,
          user_id: request.user_id,
          created_by: user?.id
        }]);

        if (projectError) {
          alert("Grant approved but failed to add project: " + projectError.message);
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("grant_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      fetchRequests();
    } catch (err) {
      alert("Failed to approve grant: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm(`Reject grant request "${request.title}"?`)) return;

    try {
      setProcessingId(request.id);

      const { error } = await supabase
        .from("grant_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      fetchRequests();
    } catch (err) {
      alert("Failed to reject grant: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: "#fbbf24", color: "#000" },
      approved: { background: "#34d399", color: "#000" },
      rejected: { background: "#f87171", color: "#000" }
    };
    return (
      <span style={{ ...badgeStyle, ...styles[status] }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Grant Requests</h1>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["pending", "approved", "rejected", "all"].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              ...tabBtn,
              background: filter === tab ? "#4ade80" : "#1f2933",
              color: filter === tab ? "#000" : "#fff"
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <div style={cardStyle}>
          <p style={muted}>No {filter === "all" ? "" : filter} grant requests</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {requests.map(req => (
            <div key={req.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3>{req.title}</h3>
                    {getStatusBadge(req.status)}
                  </div>

                  <p style={{ marginBottom: 12 }}>{req.description}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    <div>
                      <small style={muted}>Amount Requested</small>
                      <p style={{ fontSize: 20, color: "#f87171", fontWeight: 600 }}>₹{req.amount}</p>
                    </div>
                    <div>
                      <small style={muted}>Email</small>
                      <p>{req.email}</p>
                    </div>
                    <div>
                      <small style={muted}>Phone</small>
                      <p>{req.phone || "—"}</p>
                    </div>
                  </div>

                  <small style={{ ...muted, display: "block", marginTop: 12 }}>
                    Submitted: {new Date(req.created_at).toLocaleString()}
                  </small>
                </div>
              </div>

              {req.status === "pending" && (
                <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid #1f2933", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleApprove(req, false)}
                    disabled={processingId === req.id}
                    style={approveBtn}
                  >
                    {processingId === req.id ? "Processing..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleApprove(req, true)}
                    disabled={processingId === req.id}
                    style={approveProjectBtn}
                  >
                    {processingId === req.id ? "Processing..." : "✓ Approve & Add to Projects"}
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                    style={rejectBtn}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

const tabBtn = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: 500
};

const badgeStyle = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: 12,
  fontWeight: 600
};

const approveBtn = {
  background: "#34d399",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const approveProjectBtn = {
  background: "#60a5fa",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const rejectBtn = {
  background: "#f87171",
  color: "#000",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default GrantRequests;
