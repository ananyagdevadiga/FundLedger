// Centralized theme constants for consistent UI
export const colors = {
  bgPrimary: "#17171d",
  bgSecondary: "#1e1e24",
  bgCard: "#252530",
  bgHover: "#2a2a36",
  border: "#33333d",
  borderLight: "#3d3d47",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0a8",
  textMuted: "#6b6b75",
  accentGreen: "#33d17a", // reverted to original green
  accentRed: "#ec5e5e",
  accentYellow: "#f5a623",
  accentBlue: "#3b82f6", // original blue
  accentPurple: "#8b5cf6",
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
};

export const borderRadius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
};

// Reusable style objects
export const cardStyle = {
  background: colors.bgCard,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
  padding: spacing.lg,
};

export const inputStyle = {
  background: colors.bgSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  padding: "12px 16px",
  color: colors.textPrimary,
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export const buttonPrimary = {
  background: colors.accentGreen,
  color: "#000",
  border: "none",
  borderRadius: borderRadius.md,
  padding: "12px 24px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
  transition: "transform 0.2s, box-shadow 0.2s",
};

export const buttonSecondary = {
  background: "transparent",
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  padding: "12px 24px",
  fontWeight: 500,
  cursor: "pointer",
  fontSize: "14px",
  transition: "background 0.2s, border-color 0.2s",
};

export const buttonDanger = {
  background: "transparent",
  color: colors.accentRed,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  padding: "12px 24px",
  fontWeight: 500,
  cursor: "pointer",
  fontSize: "14px",
};

export const tableStyles = {
  header: {
    color: colors.textMuted,
    fontSize: "12px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "12px 0",
    borderBottom: `1px solid ${colors.border}`,
  },
  row: {
    borderBottom: `1px solid ${colors.border}`,
    transition: "background 0.2s",
  },
  cell: {
    padding: "16px 0",
    color: colors.textPrimary,
  },
  cellMuted: {
    padding: "16px 0",
    color: colors.textMuted,
    fontSize: "14px",
  },
};
