import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const user = data?.user;
      if (!user) {
        setError("Login failed. Please try again.");
        return;
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        // Profile doesn't exist, create one
        await supabase.from("profiles").insert([{
          id: user.id,
          email: user.email,
          role: "user"
        }]);
        addToast("Login successful!", "success");
        navigate("/home");
        return;
      }

      addToast("Login successful!", "success");
      if (profile.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0e14",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        width: 360,
        background: "#111827",
        padding: 30,
        borderRadius: 12,
        border: "1px solid #1f2933",
        color: "white"
      }}>
        <h2 style={{ marginBottom: 20 }}>Sign in</h2>

        {error && (
          <div style={{ background: "#7f1d1d", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />

          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14 }}>
          New user?{" "}
          <Link to="/signup" style={{ color: "#4ade80", textDecoration: "none" }}>
            Create Account
          </Link>
        </p>

        <Link 
          to="/home" 
          style={{ 
            display: "block", 
            marginTop: 16, 
            textAlign: "center", 
            color: "#9ca3af", 
            textDecoration: "none",
            fontSize: 14
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #1f2933",
  background: "#0b0e14",
  color: "white"
};

const btnStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: "#4ade80",
  cursor: "pointer",
  fontWeight: 600
};

export default Login;
