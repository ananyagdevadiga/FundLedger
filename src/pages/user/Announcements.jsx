import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Announcements</h1>

      {loading && <p>Loading announcements…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map(ann => (
            <div key={ann.id} style={cardStyle}>
              <p style={{ marginBottom: 8 }}>{ann.message}</p>
              <small style={muted}>
                {new Date(ann.created_at).toLocaleDateString()}
              </small>
            </div>
          ))}

          {announcements.length === 0 && (
            <div style={cardStyle}>
              <p style={muted}>No announcements yet</p>
            </div>
          )}
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

const muted = {
  color: "#9ca3af",
  fontSize: 14
};

export default Announcements;
