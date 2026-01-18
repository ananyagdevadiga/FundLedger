import { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

function RequestGrant() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    amount: "",
    title: "",
    description: ""
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const startTime = Date.now();
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        if (!data.user) {
          navigate("/login");
          return;
        }
        if (isMounted) {
          setUser(data.user);
          setForm(prev => ({ ...prev, email: data.user.email }));
        }
      } catch (err) {
        // Ignore AbortError
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          return;
        }
        if (isMounted) {
          console.error(err);
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

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title || !form.amount || !form.description) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("grant_requests").insert([
        {
          user_id: user.id,
          title: form.title,
          description: form.description,
          amount: Number(form.amount),
          phone: form.phone,
          email: form.email,
          status: "pending"
        }
      ]);

      if (error) throw error;

      addToast("Grant request submitted successfully!", "success");
      setForm({
        name: "",
        phone: "",
        email: user.email,
        amount: "",
        title: "",
        description: ""
      });
    } catch (err) {
      addToast("Failed to submit grant request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <UserLayout><Spinner /></UserLayout>;

  return (
    <UserLayout>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Request Grant</h1>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          {success && <p style={{ color: "#34d399" }}>{success}</p>}

          <input
            name="title"
            placeholder="Grant Title *"
            value={form.title}
            onChange={handleChange}
            style={inputStyle}
          />

          <textarea
            name="description"
            placeholder="Describe why you need this grant *"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={{ ...inputStyle, resize: "none" }}
          />

          <input
            name="amount"
            type="number"
            placeholder="Requested Amount (₹) *"
            value={form.amount}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            disabled
            style={{ ...inputStyle, opacity: 0.6 }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={submitBtn}
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>
    </UserLayout>
  );
}

/* ---------- styles ---------- */

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2933",
  borderRadius: "10px",
  padding: "20px",
  maxWidth: 600
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #1f2933",
  background: "#0b0e14",
  color: "white"
};

const submitBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#4ade80",
  cursor: "pointer",
  fontWeight: 600
};

export default RequestGrant;
