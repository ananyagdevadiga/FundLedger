function Topbar() {
  return (
    <div style={{
      height: "60px",
      background: "#0b0e14",
      borderBottom: "1px solid #1f2933",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px"
    }}>
      <span style={{ color: "#9ca3af", fontSize: 14 }}>
        🌐 This organization has made their finances public.
      </span>

      <div style={{ display: "flex", gap: "10px" }}>
        {/* Buttons removed - donations not needed */}
      </div>
    </div>
  );
}

export default Topbar;
