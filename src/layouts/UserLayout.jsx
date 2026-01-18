import UserSidebar from "../components/UserSidebar";
import Topbar from "../components/Topbar";

function UserLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0e14" }}>
      <UserSidebar />

      <div style={{ flex: 1, color: "white" }}>
        <Topbar />
        <div style={{ padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default UserLayout;
