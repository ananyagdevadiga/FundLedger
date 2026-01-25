import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius } from "../../styles/theme";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

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

      // Profile error handled silently

      // Check if email confirmation is required
      if (data.session) {
        addToast("Account created successfully!", "success");
        navigate("/home");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageContainer}>
      {/* Background decoration */}
      <div style={bgGradient} />

      <div style={formCard}>
        {/* Logo */}
        <div style={logoContainer}>
          <img src="/logo2.png" alt="FundLedger Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
          <span style={logoText}>FundLedger</span>
        </div>

        <h2 style={titleStyle}>Create your account</h2>
        <p style={subtitleStyle}>Join us for transparent financial management</p>

        {error && (
          <div style={errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {success ? (
          <div style={successContainer}>
            <div style={successBox}>
              <div style={successIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 style={successTitle}>Account created!</h3>
              <p style={successText}>
                Please check your email to confirm your account, then sign in.
              </p>
            </div>
            <Link to="/login" style={btnStyle}>
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={inputGroup}>
              <label style={labelStyle}>Full Name</label>
              <div style={inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={inputIcon}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={inputStyle} 
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroup}>
              <label style={labelStyle}>Email</label>
              <div style={inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={inputIcon}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  type="email"
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={inputStyle} 
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroup}>
              <label style={labelStyle}>Password</label>
              <div style={inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={inputStyle} 
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%",
              padding: "14px 0",
              fontSize: 17,
              fontWeight: 700,
              border: "none",
              borderRadius: borderRadius.md,
              color: "#fff",
              background: "linear-gradient(90deg, #1ec28b 0%, #33d17a 100%)",
              boxShadow: "0 2px 8px 0 rgba(30,194,139,0.10)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s, box-shadow 0.2s",
              marginTop: 8,
              marginBottom: 8,
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? (
                <span style={loadingContent}>
                  <span style={spinner} />
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>

            <div style={divider}>
              <span style={dividerLine} />
              <span style={dividerText}>or</span>
              <span style={dividerLine} />
            </div>

            <p style={signinText}>
              Already have an account?{" "}
              <Link to="/login" style={linkStyle}>
                Sign in
              </Link>
            </p>

            <Link to="/home" style={backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Home
            </Link>
          </form>
        )}
      </div>

      {/* Footer */}
      <p style={footerText}>Transparent finances for your organization</p>
    </div>
  );
}

/* ---------- styles ---------- */

const pageContainer = {
  minHeight: "100vh",
  background: colors.bgPrimary,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
  position: "relative",
  overflow: "hidden",
};

const bgGradient = {
  position: "absolute",
  top: "-50%",
  left: "-50%",
  width: "200%",
  height: "200%",
  background: `radial-gradient(circle at 70% 30%, ${colors.accentGreen}08 0%, transparent 40%), 
               radial-gradient(circle at 30% 70%, ${colors.accentBlue}08 0%, transparent 40%)`,
  pointerEvents: "none",
};

const formCard = {
  width: "100%",
  maxWidth: "400px",
  background: colors.bgCard,
  padding: spacing.xl,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
  position: "relative",
  zIndex: 1,
};

const logoContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
};

const logoIcon = {
  width: "44px",
  height: "44px",
  borderRadius: borderRadius.md,
  background: `linear-gradient(135deg, ${colors.accentGreen}, ${colors.accentBlue})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const logoText = {
  fontSize: "24px",
  fontWeight: 700,
  color: colors.textPrimary,
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
  textAlign: "center",
};

const subtitleStyle = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: spacing.xs,
  marginBottom: spacing.lg,
  textAlign: "center",
};

const errorBox = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  background: `${colors.accentRed}15`,
  border: `1px solid ${colors.accentRed}40`,
  borderRadius: borderRadius.md,
  color: colors.accentRed,
  fontSize: "14px",
  marginBottom: spacing.md,
};

const successContainer = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.lg,
};

const successBox = {
  textAlign: "center",
  padding: spacing.lg,
  background: `${colors.accentGreen}10`,
  border: `1px solid ${colors.accentGreen}30`,
  borderRadius: borderRadius.md,
};

const successIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: `${colors.accentGreen}20`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentGreen,
  margin: "0 auto",
  marginBottom: spacing.md,
};

const successTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.sm,
};

const successText = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const inputGroup = {
  marginBottom: spacing.md,
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
};

const inputWrapper = {
  position: "relative",
};

const inputIcon = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  color: colors.textMuted,
  pointerEvents: "none",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px 12px 44px",
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgSecondary,
  color: colors.textPrimary,
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const btnStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  borderRadius: borderRadius.md,
  border: "none",
  background: `linear-gradient(135deg, ${colors.accentGreen}, ${colors.accentBlue})`,
  color: "#fff",
  fontSize: "15px",
  fontWeight: 600,
  marginTop: spacing.sm,
  transition: "transform 0.2s, box-shadow 0.2s",
  textDecoration: "none",
  textAlign: "center",
  cursor: "pointer",
};

const loadingContent = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
};

const spinner = {
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const divider = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  margin: `${spacing.lg} 0`,
};

const dividerLine = {
  flex: 1,
  height: "1px",
  background: colors.border,
};

const dividerText = {
  fontSize: "12px",
  color: colors.textMuted,
  textTransform: "uppercase",
};

const signinText = {
  textAlign: "center",
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const linkStyle = {
  color: colors.accentGreen,
  textDecoration: "none",
  fontWeight: 500,
};

const backLink = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  marginTop: spacing.lg,
  color: colors.textMuted,
  textDecoration: "none",
  fontSize: "14px",
  transition: "color 0.2s",
};

const footerText = {
  marginTop: spacing.xl,
  fontSize: "13px",
  color: colors.textMuted,
  position: "relative",
  zIndex: 1,
};

export default Signup;
