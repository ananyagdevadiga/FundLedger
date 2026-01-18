import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncements = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);

        const { data, error } = await supabase
          .from("announcements")
          .select("id, message, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setAnnouncements(data || []);
        }
      } catch (err) {
        // Ignore AbortError but still set loading to false
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          // Don't log or show error for AbortError
        } else if (isMounted) {
          setError("Failed to load announcements");
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

    fetchAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Announcements</h1>

      {loading && <Spinner />}
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
