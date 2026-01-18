import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, PrivateRoute } from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// User pages
import Home from "./pages/user/Home";
import Announcements from "./pages/user/Announcements";
import Transactions from "./pages/user/Transactions";
import QRScanner from "./pages/user/QRScanner";
import RequestGrant from "./pages/user/RequestGrant";

// Admin pages
import AdminHome from "./pages/admin/AdminHome";
import GrantRequests from "./pages/admin/GrantRequests";
import Projects from "./pages/admin/Projects";
import AdminTransactions from "./pages/admin/Transactions";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminQRScanner from "./pages/admin/QRScanner";

function App() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/home" />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* User site (public + logged in users) */}
      <Route path="/home" element={<Home />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/scan" element={<QRScanner />} />
      <Route path="/request-grant" element={<PrivateRoute><RequestGrant /></PrivateRoute>} />

      {/* Admin site - Protected */}
      <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
      <Route path="/admin/grants" element={<AdminRoute><GrantRequests /></AdminRoute>} />
      <Route path="/admin/projects" element={<AdminRoute><Projects /></AdminRoute>} />
      <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
      <Route path="/admin/scan" element={<AdminRoute><AdminQRScanner /></AdminRoute>} />
    </Routes>
  );
}

export default App;
