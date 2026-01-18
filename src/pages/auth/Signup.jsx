import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password 
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data?.user;
      
      if (!user) {
        setError("Signup failed. Please try again.");
        return;
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([{
        id: user.id,
        name: name.trim(),
        email: email.trim(),
        role: "user"
      }]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // Check if email confirmation is required
      if (data.session) {
        navigate("/home");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
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
        <h2 style={{ marginBottom: 20 }}>Create Account</h2>

        {error && (
          <div style={{ background: "#7f1d1d", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div style={{ background: "#14532d", padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}>✓ Account created successfully!</p>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                Please check your email to confirm your account, then sign in.
              </p>
            </div>
            <Link to="/login" style={{ ...btnStyle, display: "block", textAlign: "center", textDecoration: "none" }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <input 
              placeholder="Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={inputStyle} 
              disabled={loading}
            />
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
              placeholder="Password (min 6 characters)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={inputStyle} 
              disabled={loading}
            />

            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p style={{ marginTop: 16, fontSize: 14 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#4ade80", textDecoration: "none" }}>
                Sign In
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
          </form>
        )}
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
  color: "white",
  boxSizing: "border-box"
};

const btnStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: "#4ade80",
  cursor: "pointer",
  fontWeight: 600,
  color: "#000"
};

export default Signup;
