import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { SocketProvider } from "./socket/SocketContext";

import RequireAuth from "./auth/RequireAuth";

import AppShell from "./layout/AppShell";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import Bikes from "./pages/Bikes";
import Cities from "./pages/Cities"; // om du skapade Cities
import EditUser from "./pages/EditUser";
import AddUser from "./pages/AddUser"; 
import History from "./pages/History"; 
import EditBike from "./pages/EditBike"; 
import AddBike from "./pages/AddBike"; 
import UserHistory from "./pages/UserHistory"; 
import Simulation from "./pages/Simulation"; 

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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

            <Route path="/users/add" element={
              <RequireAuth>
                <AppShell><AddUser/></AppShell>
              </RequireAuth>
            } />

            <Route path="/users/:id" element={
              <RequireAuth>
                <AppShell><EditUser/></AppShell>
              </RequireAuth>
            } />

            <Route path="/bikes" element={
              <RequireAuth>
                <AppShell><Bikes /></AppShell>
              </RequireAuth>
            } />

            <Route path="/bikes/add" element={
              <RequireAuth>
                <AppShell><AddBike /></AppShell>
              </RequireAuth>
            } />

            <Route path="/bikes/:id" element={
              <RequireAuth>
                <AppShell><EditBike /></AppShell>
              </RequireAuth>
            } />

            <Route path="/cities" element={
              <RequireAuth>
                <AppShell><Cities /></AppShell>
              </RequireAuth>
            } />

            <Route path="/history" element={
              <RequireAuth>
                <AppShell><History /></AppShell>
              </RequireAuth>
            } />

            <Route path="/history/:id" element={
              <RequireAuth>
                <AppShell><UserHistory /></AppShell>
              </RequireAuth>
            } />

            <Route path="/simulation" element={
              <RequireAuth>
                <AppShell><Simulation /></AppShell>
              </RequireAuth>
            } />

            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
