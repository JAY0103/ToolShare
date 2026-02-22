// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AddItem from "./pages/AddItem";
import BookItem from "./pages/BookItem";
import MyBookings from "./pages/MyBookings";
import RequestedBookings from "./pages/RequestedBookings";
import EditItem from "./pages/EditItem";
import Items from "./pages/Items";
import Cart from "./pages/Cart";
import OwnerBookingHistory from "./pages/Ownerbookinghistory";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h3>Loading...</h3>
      </div>
    );

  // helper (Faculty/Admin access)
  const isFacultyOrAdmin =
    user && ["faculty", "admin"].includes(String(user.user_type || "").toLowerCase());

  return (
    <Router>
      {user && <Navbar onSearch={setSearchTerm} />}
      <div>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <Home searchTerm={searchTerm} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/home" />} />

          <Route path="/add-item" element={isFacultyOrAdmin ? <AddItem /> : <Navigate to="/home" />} />
          <Route path="/book-item" element={user ? <BookItem /> : <Navigate to="/login" />} />
          <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />

          <Route
            path="/requested-bookings"
            element={isFacultyOrAdmin ? <RequestedBookings /> : <Navigate to="/home" />}
          />

          <Route path="/edit-item" element={isFacultyOrAdmin ? <EditItem /> : <Navigate to="/home" />} />
          <Route path="/items" element={user ? <Items searchTerm={searchTerm} /> : <Navigate to="/login" />} />
          <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" />} />
          <Route path="/owner-booking-history"element={isFacultyOrAdmin ? <OwnerBookingHistory /> : <Navigate to="/home" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;