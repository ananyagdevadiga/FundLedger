import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius } from "../../styles/theme";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        // Profile doesn't exist, create one (use cached signup name if available)
        const cachedName = localStorage.getItem('hcb-signup-name') || null;
        await supabase.from("profiles").upsert([{
          id: user.id,
          email: user.email,
          name: cachedName,
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
    <div style={pageContainer}>
      {/* Background decoration */}
      <div style={bgGradient} />

      <div style={formCard}>
        {/* Logo */}
        <div style={logoContainer}>
          <img src="/logo2.png" alt="FundLedger Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
          <span style={logoText}>FundLedger</span>
        </div>

        <h2 style={titleStyle}>Welcome back</h2>
        <p style={subtitleStyle}>Sign in to your account to continue</p>

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

        <form onSubmit={handleLogin}>
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
            <div style={{ position: 'relative' }}>
              <div style={inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
              <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: colors.textMuted, zIndex: 2 }}>
                {showPassword ? <Eye size={18} color={colors.textMuted} strokeWidth={2} /> : <EyeOff size={18} color={colors.textMuted} strokeWidth={2} />}
              </button>
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
                Signing in...
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <div style={divider}>
          <span style={dividerLine} />
          <span style={dividerText}>or</span>
          <span style={dividerLine} />
        </div>

        <p style={signupText}>
          Don't have an account?{" "}
          <Link to="/signup" style={linkStyle}>
            Create one
          </Link>
        </p>

        <Link to="/home" style={backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Home
        </Link>
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
  background: `radial-gradient(circle at 30% 20%, ${colors.accentGreen}08 0%, transparent 40%), 
               radial-gradient(circle at 70% 80%, ${colors.accentBlue}08 0%, transparent 40%)`,
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
  padding: "12px 44px 12px 44px",
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

const signupText = {
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

export default Login;
