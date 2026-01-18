import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      alert("Please enter announcement message");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("announcements").insert([{
        message: message.trim(),
        created_by: user?.id
      }]);

      if (error) throw error;

      setMessage("");
      addToast("Announcement posted successfully!", "success");
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to post announcement: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
      addToast("Announcement deleted", "success");
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // Post fund update announcement
  const postFundUpdate = async () => {
    try {
      const { data: txnData } = await supabase
        .from("transactions")
        .select("amount, type");

      let balance = 0;
      (txnData || []).forEach(txn => {
        if (txn.type === "credit") balance += Number(txn.amount);
        if (txn.type === "debit") balance -= Number(txn.amount);
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const msg = `Fund Update: Our current total fund stands at ₹${balance.toLocaleString()}`;

      const { error } = await supabase.from("announcements").insert([{ 
        message: msg,
        created_by: user?.id
      }]);
      
      if (error) throw error;
      addToast("Fund update posted!", "success");
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to post fund update: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Announcements</h1>

      {/* Post Form */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16 }}>Post New Announcement</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Write your announcement message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "none" }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button type="submit" disabled={submitting} style={primaryBtn}>
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
            <button type="button" onClick={postFundUpdate} style={{...secondaryBtn, display: "flex", alignItems: "center", gap: "8px"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="14" width="4" height="7" rx="1" fill="#60a5fa"/>
                <rect x="10" y="8" width="4" height="13" rx="1" fill="#60a5fa"/>
                <rect x="17" y="3" width="4" height="18" rx="1" fill="#60a5fa"/>
              </svg>
              Post Fund Update
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>All Announcements</h3>

        {loading ? (
          <Spinner />
        ) : announcements.length === 0 ? (
          <div style={cardStyle}>
            <p style={muted}>No announcements yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.map(ann => (
              <div key={ann.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ marginBottom: 8 }}>{ann.message}</p>
                    <small style={muted}>
                      {new Date(ann.created_at).toLocaleString()}
                    </small>
                  </div>
                  <button onClick={() => handleDelete(ann.id)} style={deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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

const deleteBtn = {
  background: "#f87171",
  color: "#000",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500
};

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default AdminAnnouncements;
