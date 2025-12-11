import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";

import AppShell from "./layout/AppShell";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import Bikes from "./pages/Bikes";
import Cities from "./pages/Cities"; // om du skapade Cities

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <RequireAuth>
              <AppShell><AdminDashboard /></AppShell>
            </RequireAuth>
          } />

          <Route path="/users" element={
            <RequireAuth>
              <AppShell><Users /></AppShell>
            </RequireAuth>
          } />

          <Route path="/bikes" element={
            <RequireAuth>
              <AppShell><Bikes /></AppShell>
            </RequireAuth>
          } />

          <Route path="/cities" element={
            <RequireAuth>
              <AppShell><Cities /></AppShell>
            </RequireAuth>
          } />

          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
