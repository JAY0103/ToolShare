// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth }               from "./contexts/AuthContext";
import { NotificationProvider }                from "./contexts/NotificationContext";

import Navbar                from "./components/Navbar";
import Login                 from "./pages/Login";
import Signup                from "./pages/Signup";
import Home                  from "./pages/Home";
import AddItem               from "./pages/AddItem";
import BookItem              from "./pages/BookItem";
import MyBookings            from "./pages/MyBookings";
import RequestedBookings     from "./pages/RequestedBookings";
import EditItem              from "./pages/EditItem";
import Items                 from "./pages/Items";
import Cart                  from "./pages/Cart";
import OwnerBookingHistory   from "./pages/OwnerBookingHistory";
import EditConditionImages   from "./pages/EditConditionImages";
import ForgotPassword        from "./pages/ForgotPassword";
import ResetPassword         from "./pages/ResetPassword";
import AdminPanel            from "./pages/AdminPanel";

// ── Inner component — can now call useAuth() safely inside the provider ──
function AppRoutes() {
  const { user, loading, isFacultyOrAdmin, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login"    element={!user ? <Login />  : <Navigate to="/home" />} />
        <Route path="/signup"   element={!user ? <Signup /> : <Navigate to="/home" />} />
        <Route path="/home"     element={user  ? <Home />   : <Navigate to="/login" />} />
        <Route path="/"         element={<Navigate to="/home" />} />

        <Route path="/add-item"
          element={isFacultyOrAdmin ? <AddItem />  : <Navigate to="/home" />} />
        <Route path="/book-item"
          element={user ? <BookItem /> : <Navigate to="/login" />} />
        <Route path="/my-bookings"
          element={user ? <MyBookings /> : <Navigate to="/login" />} />
        <Route path="/requested-bookings"
          element={isFacultyOrAdmin ? <RequestedBookings /> : <Navigate to="/home" />} />
        <Route path="/edit-item"
          element={isFacultyOrAdmin ? <EditItem /> : <Navigate to="/home" />} />
        <Route path="/items"
          element={user ? <Items /> : <Navigate to="/login" />} />
        <Route path="/cart"
          element={user ? <Cart />  : <Navigate to="/login" />} />
        <Route path="/owner-booking-history"
          element={isFacultyOrAdmin ? <OwnerBookingHistory /> : <Navigate to="/home" />} />
        <Route path="/edit-condition-images"
          element={isFacultyOrAdmin ? <EditConditionImages /> : <Navigate to="/home" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin"
          element={isAdmin ? <AdminPanel /> : <Navigate to="/home" />} />
      </Routes>
    </>
  );
}

// ── Root component — wraps everything in providers ──
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}
